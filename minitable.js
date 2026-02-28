/**
 * MiniTable v1.0
 * (c) 2026 OrtegaDevs
 * * Este programa es software libre: puedes redistribuirlo y/o modificarlo
 * bajo los términos de la Licencia Pública General GNU publicada por
 * la Free Software Foundation, ya sea la versión 3 de la Licencia, o
 * (a tu elección) cualquier versión posterior.
 *
 * Este programa se distribuye con la esperanza de que sea útil,
 * pero SIN NINGUNA GARANTÍA. Consulta la Licencia Pública General 
 * GNU para más detalles.
 *
 * Deberías haber recibido una copia de la Licencia Pública General 
 * GNU junto con este programa. Si no, visita <https://www.gnu.org/licenses/>.
 */
const _MINI_ICONS = {
    view: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    drag: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>`,
    reset: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/></svg>`
};

class MiniTable {
    constructor(selector, config) {
        this.containerSelector = selector; 
        this.container = document.querySelector(selector);
        this.config = config;
        this.url = config.url;
        this.urlEliminar = config.urlEliminar || null;
        this.urlDetail = config.urlDetail || null;
        this.urlOrden = config.urlOrden || null;
        this.permissions = {};
        this.botonesExtra = config.botonesExtra || []; // Array de nuevos botones
        
        // Control de botones flotantes (por defecto true)
        this.botonesFlotantes = config.botonesFlotantes !== false;
        
        // Permisos iniciales (por defecto todo activo)
        this.permissions = { view: 1, create: 1, edit: 1, delete: 1 };
        
        this.columnas = config.columns;
        this.limite = config.paginacion || 5;
        this.seleccionable = config.seleccionable || false; 
        this.editable = config.editable || false; // Nueva opción para activar edición rápida
        this.draggable = config.draggable || false; // <--- AGREGA ESTA LÍNEA Drag & Drop
        this.urlUpdate = config.urlUpdate || null;
        this.paginaActual = 1;
        this.datosCompletos = [];
        this.datosFiltrados = [];
        this.ordenColumna = null;
        this.ordenAscendente = true;

        if (!this.container) return;
        this.init();
    }

    async init() {
        // --- MENSAJE DE CONSOLA (Siempre visible) ---
        console.log("%c MiniTable v1.0 %c By OrtegaDevs %c", 
            "color: #fff; background: #0d6efd; padding: 3px 10px; border-radius: 3px 0 0 3px; font-weight: bold;", 
            "color: #0d6efd; background: #e9ecef; padding: 3px 10px; border-radius: 0 3px 3px 0; font-weight: bold;", 
            "background: transparent");
        this.container.innerHTML = `
            <div class="mini-table-header">
                <div class="header-control-group-container">
                    <div class="header-control-group">
                        <span>Mostrar</span>
                        <select class="change-limit">
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span>registros</span>
                    </div>
                    
                    <div class="header-control-group search-group">
                        <label>Buscar: </label>
                        <div class="search-container">
                            <input type="text" class="table-search" placeholder="Filtrar datos...">
                            <button class="btn-gmail-icon icon-refresh" title="Refrescar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="menu-acciones-iconos">
                <button class="btn-gmail-icon btn-cancelar-todo" title="Desmarcar todo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="acciones-seleccion-group" style="display: flex; gap: 8px;">
                    <button class="btn-gmail-icon icon-delete" title="Eliminar seleccionados">
                        ${_MINI_ICONS.delete}
                    </button>
                    <button class="btn-gmail-icon icon-export" title="Exportar a Excel">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    </button>
                </div>
            </div>
            
            <div class="mini-table-wrapper">
                <table class="mini-table">
                    <thead><tr class="head-row"></tr></thead>
                    <tbody class="body-rows"></tbody>
                </table>
            </div>
            <div class="mini-pagination"></div>`;

        // --- PROTECCIÓN DE MARCA ---
        const randomClass = 'mt-' + Math.random().toString(36).substring(2, 7);

        const signatureDiv = document.createElement('div');
        signatureDiv.className = randomClass; 
        signatureDiv.style = 'font-size: 10px; color: #ccc; text-align: right; padding: 5px; cursor: default; user-select: none; display: block !important;';
        
        const d = "Devs";
        const o = "Ortega";
        signatureDiv.innerText = `MiniTable By ${o}${d}`;
        this.container.appendChild(signatureDiv);

        setTimeout(() => {
            const sig = signatureDiv; 
            const rect = sig ? sig.getBoundingClientRect() : { width: 0, height: 0 };
            const style = window.getComputedStyle(sig || {});
            
            const isHacked = !sig || 
                             !this.container.contains(sig) || 
                             sig.innerText.trim() !== 'MiniTable By OrtegaDevs' || 
                             rect.width === 0 || 
                             rect.height === 0 || 
                             style.display === 'none' || 
                             style.visibility === 'hidden' || 
                             style.opacity === '0';

            // Ya no es estricto: Si detecta cambio, solo avisa en consola de forma profesional
            if (isHacked) {
               //Sin accion
            }
        }, 3000);

        const bodyRows = this.container.querySelector('.body-rows');

        // --- 1. EVENTOS DE FILA (Click simple para acciones) ---
        bodyRows.onclick = (e) => {
            const btnDelete = e.target.closest('.icon-delete-row');
            const btnEdit = e.target.closest('.icon-edit-row');
            const btnView = e.target.closest('.icon-view-row');

            if (btnDelete && this.permissions.delete) {
                this.eliminarRegistros([btnDelete.closest('tr').getAttribute('data-id')]);
            }
            if (btnEdit && this.permissions.edit) {
                this.obtenerDetalle(btnEdit.closest('tr').getAttribute('data-id'), 'edit');
            }
            if (btnView && this.permissions.view) {
                this.obtenerDetalle(btnView.closest('tr').getAttribute('data-id'), 'view');
            }
        };

        // --- 2. EDICIÓN RÁPIDA (Doble Clic / Doble Toque Móvil) ---
        // Escritorio
        bodyRows.ondblclick = (e) => {
            const td = e.target.closest('td');
            if (td) this.inlineEdit(td);
        };

        // Móvil (Simulación de doble toque)
        let ultimoToque = 0;
        bodyRows.addEventListener('touchstart', (e) => {
            const ahora = Date.now();
            const diferencia = ahora - ultimoToque;
            ultimoToque = ahora;

            if (diferencia < 300 && diferencia > 0) {
                const td = e.target.closest('td');
                if (td) this.inlineEdit(td);
            }
        }, { passive: true });

        // --- 3. EVENTOS DE BARRA SUPERIOR ---
        this.container.querySelector('.icon-delete').onclick = () => {
            const checks = this.container.querySelectorAll('.row-check:checked');
            if (checks.length === 0) return;
            const seleccionados = Array.from(checks).map(input => input.dataset.id);
            this.eliminarRegistros(seleccionados);
        };

        this.container.querySelector('.icon-refresh').onclick = () => this.refrescarTabla();
        this.container.querySelector('.icon-export').onclick = () => this.exportarExcel();
        
        this.container.querySelector('.btn-cancelar-todo').onclick = () => {
            this.container.querySelectorAll('.row-check').forEach(ch => {
                ch.checked = false;
                ch.closest('tr').classList.remove('is-selected');
            });
            const checkAll = this.container.querySelector('.check-all');
            if (checkAll) checkAll.checked = false;
            this.toggleBarraAcciones();
        };

        // --- 4. CONTROLES DE TABLA (Límite y Búsqueda) ---
        this.container.querySelector('.change-limit').onchange = (e) => {
            this.limite = parseInt(e.target.value);
            this.paginaActual = 1;
            this.dibujar();
        };

        this.container.querySelector('.table-search').oninput = (e) => this.filtrar(e.target.value);

        // --- 5. INICIALIZACIÓN DE DATOS ---
        if (this.seleccionable) this.initMultiSelector();

        // --- NUEVO: Gestión de Drag & Drop ---
        // --- Gestión de Drag & Drop con protección contra archivos externos ---
        let filaArrastrada = null;

        bodyRows.addEventListener('dragstart', (e) => {
            filaArrastrada = e.target.closest('tr');
            if (filaArrastrada) {
                filaArrastrada.classList.add('dragging');
                // Esto ayuda al navegador a entender que es un movimiento interno
                e.dataTransfer.effectAllowed = 'move'; 
            }
        });

        bodyRows.addEventListener('dragover', (e) => {
            // PROTECCIÓN 1: Si no hay una fila de nuestra tabla (ej. arrastras un archivo), 
            // cancelamos todo para evitar errores de "null"
            if (!filaArrastrada) return;

            e.preventDefault(); 
            const filaSobre = e.target.closest('tr');

            // PROTECCIÓN 2: Verificamos que 'filaSobre' exista, no sea la misma fila 
            // y que pertenezca a la misma tabla (bodyRows)
            if (filaSobre && filaSobre !== filaArrastrada && filaSobre.parentElement === bodyRows) {
                const bounding = filaSobre.getBoundingClientRect();
                const offset = e.clientY - bounding.top;

                if (offset > bounding.height / 2) {
                    filaSobre.after(filaArrastrada);
                } else {
                    filaSobre.before(filaArrastrada);
                }
            }
        });

        bodyRows.addEventListener('dragend', () => {
            if (filaArrastrada) {
                filaArrastrada.classList.remove('dragging');
                this.actualizarOrdenTrasDrag();
                // Limpiamos la variable para que quede lista para el siguiente arrastre
                filaArrastrada = null; 
            }
        });

        // Carga inicial (Llama a cargarDatos que separa permisos y registros)
        await this.cargarDatos();

    }
    async cargarDatos() {
        try {
            const respuesta = await fetch(this.url);
            const resultado = await respuesta.json();
            
            // CAMBIO: Guardamos permisos y datos por separado
            this.permissions = resultado.permissions || {}; 
            this.datosCompletos = resultado.data || [];
            
            this.datosFiltrados = [...this.datosCompletos];
            this.renderizarCabeceras();
            this.dibujar();
        } catch (error) {
            if (this.config.onError) this.config.onError(error);
        }
    }

    async obtenerDetalle(id, modo) {
        if (!this.urlDetail) return;
        try {
            const res = await fetch(this.urlDetail, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const datos = await res.json();
            
            if (modo === 'edit' && this.config.onEdit) this.config.onEdit(datos);
            if (modo === 'view' && this.config.onView) this.config.onView(datos);
        } catch (error) {
            if (this.config.onEditError) this.config.onEditError(error);
        }
    }

    renderizarCuerpo(data) {
        const tbody = this.container.querySelector('.body-rows');
        tbody.innerHTML = "";

        if (data.length === 0) {
            const numeroColumnas = this.columnas.length + (this.seleccionable ? 1 : 0);
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="${numeroColumnas}" style="text-align: center; padding: 40px; color: #666;">No hay datos disponibles</td>`;
            tbody.appendChild(tr);
            return;
        }

        data.forEach(fila => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', fila.id || '');

            // Mantenemos el drag & drop en toda la fila como antes
            if (this.draggable && this.permissions.edit) {
                tr.draggable = true;
                tr.classList.add('draggable-row');
            }
            
            // CELDA 1: Handle + Checkbox (Si es seleccionable)
            if (this.seleccionable) {
                const tdCheck = document.createElement('td');
                const container = document.createElement('div');
                container.className = 'cell-with-handle';

                // SOLO si hay permiso y es draggable agregamos el span
                if (this.draggable && this.permissions.edit) {
                    container.innerHTML = `<span class="drag-handle">⋮⋮</span>`;
                }

                container.innerHTML += `<input type="checkbox" class="row-check" data-id="${fila.id || ''}">`;
                tdCheck.appendChild(container);
                tr.appendChild(tdCheck);
            }

            this.columnas.forEach((col, index) => {
                const td = document.createElement('td');
                
                // Si no hay checkbox, los puntos reales van aquí
                if (!this.seleccionable && index === 0 && this.draggable && this.permissions.edit) {
                    const container = document.createElement('div');
                    container.className = 'cell-with-handle';
                    container.innerHTML = `<span class="drag-handle">⋮⋮</span> <span>${fila[col.data] || ''}</span>`;
                    td.appendChild(container);
                } else {
                    td.textContent = fila[col.data] || ''; 
                }
                tr.appendChild(td);
            });

            if (this.botonesFlotantes) {
                const btnView = this.permissions.view ? `<button class="btn-gmail-icon btn-row-action icon-view-row" title="Ver">${_MINI_ICONS.view}</button>` : '';
                const btnEdit = this.permissions.edit ? `<button class="btn-gmail-icon btn-row-action icon-edit-row" title="Editar">${_MINI_ICONS.edit}</button>` : '';
                const btnDelete = this.permissions.delete ? `<button class="btn-gmail-icon icon-delete-row" title="Eliminar">${_MINI_ICONS.delete}</button>` : '';

                if (btnView || btnEdit || btnDelete) {
                    const divAcciones = document.createElement('div');
                    divAcciones.className = 'row-actions-floating';
                    divAcciones.innerHTML = `${btnView}${btnEdit}${btnDelete}`;
                    tr.appendChild(divAcciones);
                }
            }
            tbody.appendChild(tr);
        });

        this.toggleBarraAcciones();
    }
    // --- RESTO DE MÉTODOS SIN CAMBIOS EN LÓGICA CORE ---

    renderizarCabeceras() {
        const headerRow = this.container.querySelector('.head-row');
        headerRow.innerHTML = ""; 

        // Primera Columna (Checkbox o primer título)
        if (this.seleccionable) {
            const thCheck = document.createElement('th');
            const container = document.createElement('div');
            container.className = 'header-aligner';

            // Relleno invisible solo si es draggable para empujar el check
            if (this.draggable && this.permissions.edit) {
                container.innerHTML = `<span class="handle-filler">⋮⋮</span>`;
            }

            container.innerHTML += `<input type="checkbox" class="check-all">`;
            thCheck.appendChild(container);
            headerRow.appendChild(thCheck);
        }

        this.columnas.forEach((col, index) => {
            const th = document.createElement('th');
            
            // Si no hay checkbox, aplicamos el relleno al primer título
            if (!this.seleccionable && index === 0 && this.draggable && this.permissions.edit) {
                const container = document.createElement('div');
                container.className = 'header-aligner';
                container.innerHTML = `<span class="handle-filler">⋮⋮</span> ${col.title}`;
                th.appendChild(container);
            } else {
                th.textContent = col.title;
            }
            
            th.style.cursor = 'pointer';
            th.onclick = () => this.ordenarPor(col.data);
            headerRow.appendChild(th);
        });
    }

    initMultiSelector() {
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('check-all')) {
                const isChecked = e.target.checked;
                this.container.querySelectorAll('.row-check').forEach(check => {
                    check.checked = isChecked;
                    check.closest('tr').classList.toggle('is-selected', isChecked);
                });
            }
            if (e.target.classList.contains('row-check')) {
                e.target.closest('tr').classList.toggle('is-selected', e.target.checked);
                if (!e.target.checked) {
                    const checkAll = this.container.querySelector('.check-all');
                    if(checkAll) checkAll.checked = false;
                }
            }
            this.toggleBarraAcciones();
        });
    }
    /*
    toggleBarraAcciones() {
        const seleccionados = this.container.querySelectorAll('.row-check:checked').length;
        const menuIconos = this.container.querySelector('.menu-acciones-iconos');
        const header = this.container.querySelector('.mini-table-header');
        
        // 1. Buscamos el contenedor de botones de forma segura
        // Buscamos el div que contiene al botón de exportar (que siempre debería estar)
        const btnExport = menuIconos.querySelector('.icon-export');
        const grupoAcciones = btnExport ? btnExport.parentElement : menuIconos.querySelector('div');
        
        let btnDeleteMasivo = menuIconos.querySelector('.icon-delete');

        // 2. CONTROL DE DIBUJO (Sin depender de estilos CSS en el selector)
        if (this.permissions.delete == 1) { // Verificamos permiso
            if (!btnDeleteMasivo && grupoAcciones) {
                const nuevoBtn = document.createElement('button');
                nuevoBtn.className = 'btn-gmail-icon icon-delete';
                nuevoBtn.title = 'Eliminar seleccionados';
                nuevoBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
                
                nuevoBtn.onclick = () => {
                    const checks = this.container.querySelectorAll('.row-check:checked');
                    if (checks.length === 0) return;
                    const seleccionadosIds = Array.from(checks).map(input => input.dataset.id);
                    this.eliminarRegistros(seleccionadosIds);
                };
                
                // Lo insertamos al principio del grupo
                grupoAcciones.prepend(nuevoBtn);
            }
        } else {
            // Si no hay permiso, lo quitamos físicamente
            if (btnDeleteMasivo) {
                btnDeleteMasivo.remove();
            }
        }

        // 3. Visibilidad de la barra
        if (seleccionados > 0) {
            menuIconos.style.display = 'flex';
            if (header) header.style.marginBottom = '0px'; 
        } else {
            menuIconos.style.display = 'none';
            if (header) header.style.marginBottom = '20px'; 
            const checkAll = this.container.querySelector('.check-all');
            if(checkAll) checkAll.checked = false;
        }
    }*/

    toggleBarraAcciones() {
        const seleccionados = this.container.querySelectorAll('.row-check:checked').length;
        const menuIconos = this.container.querySelector('.menu-acciones-iconos');
        const header = this.container.querySelector('.mini-table-header');
        
        // Buscamos el contenedor de botones (padre del botón exportar)
        const btnExport = menuIconos.querySelector('.icon-export');
        const grupoAcciones = btnExport ? btnExport.parentElement : menuIconos.querySelector('div');

        if (grupoAcciones) {
            // --- A. GESTIÓN DEL BOTÓN ELIMINAR (Por permisos) ---
            let btnDelete = menuIconos.querySelector('.icon-delete');
            if (this.permissions.delete == 1) {
                if (!btnDelete) {
                    const b = document.createElement('button');
                    b.className = 'btn-gmail-icon icon-delete';
                    b.title = 'Eliminar seleccionados';
                    b.innerHTML = _MINI_ICONS.delete;
                    b.onclick = () => {
                        const ids = Array.from(this.container.querySelectorAll('.row-check:checked')).map(ch => ch.dataset.id);
                        if (ids.length > 0) this.eliminarRegistros(ids);
                    };
                    grupoAcciones.prepend(b);
                }
            } else if (btnDelete) {
                btnDelete.remove();
            }

            // --- B. GESTIÓN DE BOTONES EXTRA (Dinámicos) ---
            this.botonesExtra.forEach(btnConfig => {
                let btnExistente = menuIconos.querySelector(`.btn-extra-${btnConfig.icon}`);
                if (!btnExistente) {
                    const bExtra = document.createElement('button');
                    bExtra.className = `btn-gmail-icon btn-extra-${btnConfig.icon}`;
                    bExtra.title = btnConfig.title;
                    // LÓGICA DE ICONO FLEXIBLE:
                    // 1. Si existe en _MINI_ICONS, usa el SVG.
                    // 2. Si no, asume que es una clase (como fa-print) y crea un <i>.
                    if (_MINI_ICONS[btnConfig.icon]) {
                        bExtra.innerHTML = _MINI_ICONS[btnConfig.icon];
                    } else {
                        bExtra.innerHTML = `<i class="fa-solid ${btnConfig.icon}"></i>`;
                    }
                    
                    // Aquí el usuario tiene el control total de la acción
                    bExtra.onclick = () => {
                        const ids = Array.from(this.container.querySelectorAll('.row-check:checked')).map(ch => ch.dataset.id);
                        btnConfig.action(ids); 
                    };
                    grupoAcciones.appendChild(bExtra);
                }
            });
        }

        // Visibilidad de la barra
        menuIconos.style.display = seleccionados > 0 ? 'flex' : 'none';
        if (header) header.style.marginBottom = seleccionados > 0 ? '0px' : '20px';
    }

    ordenarPor(columna) {
        if (this.ordenColumna === columna) { this.ordenAscendente = !this.ordenAscendente; } 
        else { this.ordenColumna = columna; this.ordenAscendente = true; }
        this.datosFiltrados.sort((a, b) => {
            let valA = a[columna], valB = b[columna];
            if (valA < valB) return this.ordenAscendente ? -1 : 1;
            if (valA > valB) return this.ordenAscendente ? 1 : -1;
            return 0;
        });
        this.renderizarCabeceras();
        this.dibujar();
    }

    filtrar(termino) {
        const query = termino.toLowerCase();
        this.datosFiltrados = this.datosCompletos.filter(fila => 
            this.columnas.some(col => String(fila[col.data]).toLowerCase().includes(query))
        );
        this.paginaActual = 1;
        this.dibujar();
    }

    dibujar() {
        const inicio = (this.paginaActual - 1) * this.limite;
        const fin = inicio + this.limite;
        this.renderizarCuerpo(this.datosFiltrados.slice(inicio, fin));
        this.renderizarPaginacion(Math.ceil(this.datosFiltrados.length / this.limite));
    }

    renderizarPaginacion(total) {
        const pagContainer = this.container.querySelector('.mini-pagination');
        pagContainer.innerHTML = "";
        
        // --- 1. Cálculos de información ---
        const totalRegistros = this.datosFiltrados.length;
        const desde = totalRegistros === 0 ? 0 : (this.paginaActual - 1) * this.limite + 1;
        const hasta = Math.min(this.paginaActual * this.limite, totalRegistros);

        // Si no hay páginas, salimos (o podrías mostrar el texto de 0 registros)
        if (total < 1) return;

        // --- 2. Grupo de botones (Tu lógica original) ---
        const botonesGroup = document.createElement('div');
        botonesGroup.className = "pagination-buttons-group";
        
        const crearBoton = (texto, pagina, activo = false, deshabilitado = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = texto;
            if (activo) btn.classList.add('active');
            if (deshabilitado) btn.disabled = true;
            btn.onclick = () => { this.paginaActual = pagina; this.dibujar(); };
            return btn;
        };

        botonesGroup.appendChild(crearBoton('«', 1, false, this.paginaActual === 1));
        botonesGroup.appendChild(crearBoton('‹', this.paginaActual - 1, false, this.paginaActual === 1));

        let inicio = Math.max(1, this.paginaActual - 2);
        let fin = Math.min(total, inicio + 4);
        if (fin - inicio < 4) inicio = Math.max(1, fin - 4);

        for (let i = inicio; i <= fin; i++) {
            botonesGroup.appendChild(crearBoton(i, i, i === this.paginaActual));
        }

        botonesGroup.appendChild(crearBoton('›', this.paginaActual + 1, false, this.paginaActual === total));
        botonesGroup.appendChild(crearBoton('»', total, false, this.paginaActual === total));

        // --- 3. Texto informativo (Debajo de los números) ---
        const infoTexto = document.createElement('div');
        infoTexto.className = "pagination-info";
        infoTexto.style.fontSize = "12px";
        infoTexto.style.color = "#666";
        infoTexto.style.marginTop = "8px";
        infoTexto.style.textAlign = "center";
        infoTexto.innerText = `Mostrando ${desde} a ${hasta} de ${totalRegistros} resultados`;

        // --- 4. Ensamblado final ---
        // Aplicamos flex al contenedor para que el texto quede abajo y todo centrado
        pagContainer.style.display = "flex";
        pagContainer.style.flexDirection = "column";
        pagContainer.style.alignItems = "center";
        
        pagContainer.appendChild(botonesGroup);
        pagContainer.appendChild(infoTexto);
    }

    exportarExcel() {
        const seleccionados = Array.from(this.container.querySelectorAll('.row-check:checked')).map(input => input.dataset.id);
        const datosAExportar = this.datosCompletos.filter(f => seleccionados.includes(String(f.id)));
        const cabeceras = this.columnas.map(col => col.title).join(",");
        const filas = datosAExportar.map(obj => this.columnas.map(col => `"${obj[col.data]}"`).join(",")).join("\n");
        const contenidoCSV = "data:text/csv;charset=utf-8,\uFEFF" + cabeceras + "\n" + filas;
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(contenidoCSV));
        link.setAttribute("download", "exportacion.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /*async refrescarTabla() {
        const btnIcon = this.container.querySelector('.icon-refresh i');
        btnIcon.classList.add('fa-spin'); 
        this.container.querySelector('.table-search').value = "";
        this.paginaActual = 1;
        try {
            // Llamamos a cargarDatos para actualizar this.permissions y this.datosCompletos
            await this.cargarDatos();
            this.container.querySelector('.btn-cancelar-todo').click();
        } catch (error) {} finally {
            setTimeout(() => btnIcon.classList.remove('fa-spin'), 500);
        }
    }*/

    async refrescarTabla() {
        // Buscamos el SVG dentro del botón
        const btnSvg = this.container.querySelector('.icon-refresh svg');
        if (btnSvg) btnSvg.classList.add('is-spinning'); 
        
        this.container.querySelector('.table-search').value = "";
        this.paginaActual = 1;
        
        try {
            await this.cargarDatos();
            this.container.querySelector('.btn-cancelar-todo').click();
        } catch (error) {
            console.error(error);
        } finally {
            // Quitamos la animación después de que termine el giro
            setTimeout(() => {
                if (btnSvg) btnSvg.classList.remove('is-spinning');
            }, 600);
        }
    }

    async eliminarRegistros(ids) {
        // Lógica de confirmación personalizada
        if (this.config.onBeforeDelete) {
            const confirmado = await this.config.onBeforeDelete(ids);
            if (!confirmado) return; // Si el usuario retorna false, cancelamos
        } else {
            // Si el usuario no define onBeforeDelete, usamos el confirm por defecto
            if (!confirm(`¿Deseas eliminar ${ids.length} registros?`)) return;
        }

        if (!this.urlEliminar) { this.procesarEliminacionLocal(ids); return; }
        
        try {
            const respuesta = await fetch(this.urlEliminar, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: ids })
            });
            const resultado = await respuesta.json();
            if (resultado.success || resultado === true) {
                this.procesarEliminacionLocal(ids);
                if (this.config.onDeleteSuccess) this.config.onDeleteSuccess(resultado);
            } else {
                if (this.config.onDeleteError) this.config.onDeleteError(resultado);
            }
        } catch (error) {
            if (this.config.onDeleteError) this.config.onDeleteError(error);
        }
    }

    procesarEliminacionLocal(ids) {
        const idsString = ids.map(id => String(id));
        this.datosCompletos = this.datosCompletos.filter(item => !idsString.includes(String(item.id)));
        this.datosFiltrados = this.datosFiltrados.filter(item => !idsString.includes(String(item.id)));
        this.dibujar();
        const btnCancel = this.container.querySelector('.btn-cancelar-todo');
        if (btnCancel) btnCancel.click();
    }

    async inlineEdit(td) {
        // VALIDACIÓN: Solo procede si la config lo permite Y el permiso del JSON es 1
        if (!this.editable || !this.permissions.edit) return; 
        if (td.querySelector('input')) return;

        const tr = td.closest('tr');
        const id = tr.getAttribute('data-id');
        const cellIndex = td.cellIndex - (this.seleccionable ? 1 : 0);
        const colConfig = this.columnas[cellIndex];

        if (!colConfig || colConfig.editable === false) return;

        const valorOriginal = td.textContent;
        const campo = colConfig.data;

        const input = document.createElement('input');
        input.value = valorOriginal;
        input.className = 'inline-edit-input'; // Usa el CSS que definimos antes
        
        td.innerHTML = '';
        td.appendChild(input);
        input.focus();
        input.select();

        const finalizar = (valor) => { td.textContent = valor; };

        input.onkeydown = async (e) => {
            if (e.key === 'Escape') finalizar(valorOriginal);
            if (e.key === 'Enter') {
                const nuevoValor = input.value;
                if (nuevoValor === valorOriginal) return finalizar(valorOriginal);

                if (!this.urlUpdate) {
                    this.actualizarDatoLocal(id, campo, nuevoValor);
                    return finalizar(nuevoValor);
                }

                try {
                    const res = await fetch(this.urlUpdate, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, field: campo, value: nuevoValor })
                    });
                    const resJson = await res.json();
                    if (resJson.success) {
                        this.actualizarDatoLocal(id, campo, nuevoValor);
                        finalizar(nuevoValor);
                        if (this.config.onUpdateSuccess) this.config.onUpdateSuccess(resJson);
                    } else {
                        finalizar(valorOriginal);
                        if (this.config.onUpdateError) this.config.onUpdateError(resJson);
                    }
                } catch (error) {
                    finalizar(valorOriginal);
                }
            }
        };
        input.onblur = () => finalizar(valorOriginal);
    }

    // Método auxiliar para mantener los datos sincronizados
    actualizarDatoLocal(id, campo, valor) {
        const registro = this.datosCompletos.find(d => String(d.id) === String(id));
        if (registro) registro[campo] = valor;
    }

    // --- NUEVO: Sincronizar el array interno con el nuevo orden visual ---
    actualizarOrdenTrasDrag() {
        const nuevosIds = Array.from(this.container.querySelectorAll('.body-rows tr'))
                            .map(tr => String(tr.getAttribute('data-id')));
        
        const mapaDatos = new Map(this.datosFiltrados.map(d => [String(d.id), d]));
        this.datosFiltrados = nuevosIds.map(id => mapaDatos.get(id)).filter(d => d !== undefined);

        if (this.urlOrden) {
            fetch(this.urlOrden, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevoOrden: nuevosIds })
            })
            .then(res => res.json())
            .then(resJson => {
                // Eliminamos el console.log("Orden guardado en BD")
                // Si el usuario quiere saber si tuvo éxito, puede usar un callback futuro
            })
            .catch(err => {
                // Eliminamos el console.error
                // Opcional: pasar el error a un callback de configuración si existe
                if(this.config.onError) this.config.onError(err);
            });
        }

        if (this.config.onReorder) {
            this.config.onReorder(this.datosFiltrados);
        }
    }
    
}