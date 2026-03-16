import { Component,inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { SolicitudAccesoService } from '../../../services/solicitud-acceso.service';
import { SolicitudAcceso } from '../../../models/comunicacion.model';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilUsuario implements OnInit {
  private solicitudService = inject(SolicitudAccesoService);
  solicitudes: SolicitudAcceso[] = [];
  nuevoMensaje: string = '';

  ngOnInit() {
    this.cargarSolicitudes();
  }

  // 1. READ: Nos suscribimos para recibir los datos de MongoDB
  cargarSolicitudes() {
    this.solicitudService.getTodasLasSolicitudes().subscribe({
      next: (datosDelServidor) => {
        this.solicitudes = datosDelServidor;
      },
      error: (error) => {
        console.error('Error al cargar solicitudes:', error);
      }
    });
  }

  // 2. UPDATE: Mandamos el nuevo estado y recargamos la lista al terminar
  cambiarEstado(id: string | undefined, estado: 'pending' | 'accepted' | 'rejected') {
    if (!id) return;
    
    this.solicitudService.actualizarEstado(id, estado).subscribe({
      next: () => {
        this.cargarSolicitudes(); // Recargamos para ver los cambios
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
      }
    });
  }

  // 3. DELETE: Mandamos borrar y recargamos la lista al terminar
  eliminar(id: string | undefined) {
    if (!id) return;
    
    this.solicitudService.eliminarSolicitud(id).subscribe({
      next: () => {
        this.cargarSolicitudes(); // Recargamos la lista limpia
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
      }
    });
  }

  // 4. CREATE: Enviamos el POST al backend
  simularEnvio(event: Event) {
    event.preventDefault();
    if (!this.nuevoMensaje.trim()) return;

    // Preparamos el objeto sin ID (MongoDB crea el _id automáticamente)
    const nuevaSolicitud = {
      oportunidadId: 'op-' + Math.floor(Math.random() * 1000), 
      userId: 'inversor-demo',
      message: this.nuevoMensaje
    };

    this.solicitudService.crearSolicitud(nuevaSolicitud).subscribe({
      next: () => {
        this.nuevoMensaje = ''; // Limpiamos el formulario
        this.cargarSolicitudes(); // Recargamos para ver el nuevo mensaje
      },
      error: (error) => {
        console.error('Error al crear la solicitud:', error);
      }
    });
  }
}