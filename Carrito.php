<?php 
	require_once("Models/TiendaModel.php");
	class Carrito extends Controllers{
		public $tienda;
		public function __construct() 
		{
			parent::__construct();
			$this->tienda = new TiendaModel();
			// session_start();
		}


		public function detalles_carrito()
		{
			if(empty($_SESSION['carrito']['items'])){
				header("Location:".base_url());
			}
			$data['page_activa'] = "Detalles Carrito";
			$data['page_tag'] = "Detalles Carrito";
			$data['page_title'] = "Detalles Carrito";
			$data['page_name'] = "Detalles Carrito";
			$data['pageTienda'] = "Detalles Carrito";
			$data['page_functions_js'] = "functions_detalles_carrito.js";
			$this->views->getView($this,"detalles_carrito",$data);
			
		}

		public function procesar_pago()
		{	if(empty($_SESSION['carrito']['items'])){
				header("Location:".base_url());
			}
			$data['page_activa'] = "Procesar Pago";
			$data['page_tag'] = "Procesar Pago";
			$data['page_title'] = "Procesar Pago";
			$data['page_name'] = "Procesar Pago";
			$data['pageTienda'] = "Procesar Pago";
			$data['page_functions_js'] = "functions_procesar_pago.js";
			$this->views->getView($this,"procesar_pago",$data);
			
		}

		public function error_transaccion()
		{
			$data['page_tag'] = "Error en pago";
			$data['page_title'] = "Transacción bloqueada";
			$data['page_name'] = "error_pago";
			$data['mensaje'] = $_SESSION['error_pago'] ?? "Lo sentimos, no se pudo procesar el pago.";
			unset($_SESSION['error_pago']);
			$this->views->getView($this, "error_pago", $data);
		}

		public function respuesta_pago()
		{
			// Leer datos del POST o JSON
			$input = file_get_contents('php://input');
			$data = json_decode($input, true);

			if (!$data) {
				$data = $_POST;
			}

			// Log para debug
			file_put_contents('powertranz_log.txt', date('Y-m-d H:i:s') . " - Respuesta 3DSecure: " . json_encode($data) . "\n", FILE_APPEND);

			// Guardar resultado 3DS en sesión
			$_SESSION['3ds_result'] = $data;
			session_write_close(); // 🔐 Fuerza a guardar en disco ANTES del echo y del exit

			// Ver si hay RedirectHtml (iframe)
			$redirectHtml = $data['RedirectHtml'] ?? '';
			
			if (empty($redirectHtml)) {
			// Redirige desde el servidor, no desde el iframe
				header('Location: ' . base_url() . '/carrito/procesar_pago_final');
				exit;
			} else {
				// Renderiza vista con iframe
				$this->views->getView($this, "respuesta_pago", [
					'redirectHtml' => $redirectHtml,
				]);
			}

			// if (empty($redirectHtml)) {
			// 	// No hay iframe => redirigir al paso final
			// 	header('Location: ' . base_url() . '/carrito/procesar_pago_final');
			// 	exit;
			// }

			// // Si hay iframe, mostrar vista para que se cargue
			// $this->views->getView($this, "respuesta_pago", [
			// 	'redirectHtml' => $redirectHtml,
			// ]);
		}

	
		public function procesar_pago_final()
		{
			// Asegúrate de que la sesión esté activa
			// if (session_status() === PHP_SESSION_NONE) {
			// 	session_start();
			// }

			// Si no existe en sesión, intenta cargar desde cookie
			if (empty($_SESSION['datos_cliente_envio']) && !empty($_COOKIE['datos_cliente_envio'])) {
				$cookieData = json_decode($_COOKIE['datos_cliente_envio'], true);

				// Verifica que tenga todos los campos esperados
				if (
					isset($cookieData['nombre'], $cookieData['email'], $cookieData['telefono'],
						$cookieData['ciudad'], $cookieData['direccion'], $cookieData['tipoEnvio'], $cookieData['ultimos4'])
				) {
					$_SESSION['datos_cliente_envio'] = $cookieData;
				}
			}

			// Verifica si hay datos de autenticación almacenados
			// dep($_SESSION['3ds_result']);
			if (empty($_SESSION['3ds_result']) || empty($_SESSION['3ds_result']['SpiToken'])) {
				echo "No se encontró información de autenticación 3D Secure válida.";
				return;
			}

			$spiToken = $_SESSION['3ds_result']['SpiToken'];

			// Preparar cURL para enviar el token al endpoint /payment
			$url = URLAPIBAC . '/Payment'; // o sandbox si estás en pruebas
			$headers = [
				'Content-Type: application/json'
				// No se necesita PowerTranzId ni Password en esta etapa
			];

			$ch = curl_init($url);
			curl_setopt($ch, CURLOPT_POST, true);
			curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($spiToken));
			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

			$response = curl_exec($ch);
			$error = curl_error($ch);
			curl_close($ch);

			// Log de depuración
			file_put_contents('powertranz_log.txt', date('Y-m-d H:i:s') . " - Respuesta final /payment: " . $response . "\n", FILE_APPEND);

			if ($error) {
				echo "Error en la solicitud: $error";
				return;
			}

			$result = json_decode($response, true);


			$cookieData = $_SESSION['datos_cliente_envio'];
			if (!isset($_SESSION['carrito']) && isset($_COOKIE['carrito'])) {
				$carrito = json_decode($_COOKIE['carrito'], true);

				if (is_array($carrito)) {
					$_SESSION['carrito'] = $carrito;
				}
			}
			$totales = $_SESSION['carrito']['totales'];
			// dep($totales);die();
			
			$id_usuario = $_SESSION['idUser'] ?? 0; // Asignar 0 si no hay usuario logueado
			$nombre = $cookieData['nombre'];
			$email = $cookieData['email'];
			$telefono = $cookieData['telefono'];
			$ciudad = $cookieData['ciudad'];
			$direccion = $cookieData['direccion'];
			$tipoEnvio = $cookieData['tipoEnvio'];
			$respuestra_powertranz = $result ?? 'Unknown';
			$amount = $totales['total']; // Monto del cobro
			
			$productos_comprados = $_SESSION['carrito']['items'];
			// dep($productos_comprados);die();

			$password = '';
			
			$validarCorreo = $this->tienda->validarCorreo($email); 

			if (!empty($result['Approved']) && $result['Approved'] === true) {
				// Éxito en el cobro
				// echo "<h2>Pago Aprovado</h2>";
				// echo "<pre>" . print_r($result, true) . "</pre>";
				// die();

				$status = 3; // Estado del pedido (3 = Aprobado y 4 = Rechazado)
				$insertPedido = $this->tienda->insertarPedido($id_usuario, 
																$nombre,
																$email, 
																$telefono, 
																$ciudad, 
																$direccion, 
																$tipoEnvio, 
																$respuestra_powertranz, 
																$amount,
																$status);

				
				$id_pedido = $insertPedido;
				// insertar detalles del pedido
				foreach ($productos_comprados as $producto) {
					$id_producto = decryptUrlSafe($producto['id']); // Asegúrate de que el ID del producto esté desencriptado
					// dep($id_producto);die();
					$pedidoid = $id_pedido;
					$cantidad = $producto['cantidad'];
					$precio = $producto['precioTotalIten'];
					// Aquí podrías insertar cada producto en la tabla de pedidos
					$resquest_detalles = $this->tienda->insertarDetallePedido($id_producto, $pedidoid, $cantidad, $precio);
					

					//eliminar cantidad del producto del stock en la tabla productos
					$this->tienda->actualizarStockProducto($id_producto, $cantidad);

					//validar kist para insertar cliente si no esta registrado
					if ($id_producto == 15) {
						if (empty($validarCorreo)) {
							$password = passGenerator();
							$passwordEncript = hash("SHA256",$password);
							$requestUser = $this->tienda->insertarUsuarioXcompraAproada($nombre, $email, $passwordEncript);
							// dep($requestUser);die();
							if ($requestUser > 0) {
							$id_usuario = $requestUser; // Actualizar el ID del usuario si se creó uno nuevo
							}
						}
					}
				}

				// Aquí podrías enviar un correo de confirmación al usuario
				$arrResponse = array('status' => true, 'msg' => 'Pedido guardado correctamente.');
							$nombreUsuario = $nombre;

							$dataUsuario = array('nombreUsuario' => $nombreUsuario,
												'email' => $email,
												'password' => $password,
												'detallePedido' => $_SESSION['carrito'],
												'asunto' => 'Compra realalizada exitozamente.');
							enviarCorreoSMTP($dataUsuario,'email_compraExitoza');


				$data = [
					'TransactionIdentifier' => $result['TransactionIdentifier'],
					'TotalAmount' => $result['TotalAmount'],
					'CardBrand' => $result['CardBrand'],
					'id_pedido' => $id_pedido // Este lo devuelves tras guardar el pedido en BD
				];
				//Limpiar el carrito después de la compra
				unset($_SESSION['carrito']);
				//También podrías limpiar la cookie si la usas
				setcookie('carrito', '', time() - 3600, '/'); // Eliminar cookie del carrito	

				// Guardar el registro de intento de la compra
				$ip         = $_SERVER['REMOTE_ADDR'];
				$cookieId   = $_COOKIE['cliente_hash_id'] ?? 'sin_cookie';
				$ultimos4   = $cookieData['ultimos4'];
				$resultado  = ($result['Approved'] == 1) ? 'exito' : 'fallo';

				// Registrar en log_intentos_pago
				$this->tienda->registrarIntentoPago($ip, $cookieId, $ultimos4, $resultado);

				// Limpieza de sesión
				unset($_SESSION['3ds_result']);
				
				$this->views->getView($this,"respuesta_aprovada",$data);
			} else {
				//Falló el cobro
				// echo "<h2>Pago rechazado</h2>";
				// echo "<pre>" . print_r($result, true) . "</pre>";
				// die();
				// Falló el cobro
				$status = 4; // Estado del pedido (3 = Aprobado y 4 = Rechazado)
				$insertPedido = $this->tienda->insertarPedido($id_usuario, 
																$nombre,
																$email, 
																$telefono, 
																$ciudad, 
																$direccion, 
																$tipoEnvio, 
																$respuestra_powertranz, 
																$amount,
																$status);

				
				$id_pedido = $insertPedido;
				// insertar detalles del pedido
				foreach ($productos_comprados as $producto) {
					$id_producto = decryptUrlSafe($producto['id']); // Asegúrate de que el ID del producto esté desencriptado
					// dep($id_producto);die();
					$pedidoid = $id_pedido;
					$cantidad = $producto['cantidad'];
					$precio = $producto['precioTotalIten'];
					// Aquí podrías insertar cada producto en la tabla de pedidos
					$resquest_detalles = $this->tienda->insertarDetallePedido($id_producto, $pedidoid, $cantidad, $precio);


				}

				// Aquí podrías enviar un correo de confirmación al usuario
				$arrResponse = array('status' => true, 'msg' => 'Pedido rechazado.');
							$nombreUsuario = $nombre;

							$dataUsuario = array('nombreUsuario'        => $nombreUsuario,
												'email'                => $email,
												'detallePedido'        => $_SESSION['carrito'],
												'asunto'               => 'Pago rechazado – SteamRobotThink',
												'TransactionIdentifier'=> $result['TransactionIdentifier'],
												'ResponseMessage'      => $result['ResponseMessage'], // p.ej. “Invalid transaction”
												'CardBrand'            => $result['CardBrand'],
												'id_pedido'            => $id_pedido);
							enviarCorreoSMTP($dataUsuario,'email_compraRechazada');


				$data = [
					'TransactionIdentifier' => $result['TransactionIdentifier'],
					'TotalAmount' => $result['TotalAmount'],
					'CardBrand' => $result['CardBrand'],
					'ResponseMessage'       => $result['ResponseMessage'],
					'id_pedido' => $id_pedido // Este lo devuelves tras guardar el pedido en BD
				];

				// Guardar el registro de intento de la compra
				$ip         = $_SERVER['REMOTE_ADDR'];
				$cookieId   = $_COOKIE['cliente_hash_id'] ?? 'sin_cookie';
				$ultimos4   = $cookieData['ultimos4'];
				$resultado  = ($result['Approved'] == 1) ? 'exito' : 'fallo';

				// Registrar en log_intentos_pago
				$this->tienda->registrarIntentoPago($ip, $cookieId, $ultimos4, $resultado);
					
				// Limpieza de sesión
				unset($_SESSION['3ds_result']);
				
				$this->views->getView($this,"respuesta_rechazada",$data);
			}
			die();
			
		}


		



	}
?>