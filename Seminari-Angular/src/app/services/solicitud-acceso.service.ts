import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudAcceso } from '../models/comunicacion.model';

@Injectable({
  providedIn: 'root',
})

export class SolicitudAccesoService {
  private http = inject(HttpClient);
  // Datos de testeo
  private apiUrl = 'http://localhost:4000/api/solicitudes';
  constructor() { }

  // 1. READ (GET)
  getTodasLasSolicitudes(): Observable<SolicitudAcceso[]> {
    return this.http.get<SolicitudAcceso[]>(this.apiUrl);
  }

  // 2. CREATE (POST)
  crearSolicitud(nuevaSolicitud: Omit<SolicitudAcceso, 'id' | 'status'>): Observable<SolicitudAcceso> {
    return this.http.post<SolicitudAcceso>(this.apiUrl, nuevaSolicitud);
  }

  // 3. UPDATE (PUT o PATCH)
  actualizarEstado(id: string, nuevoEstado: 'pending' | 'accepted' | 'rejected'): Observable<SolicitudAcceso> {
    // Asumimos que tu backend acepta un PATCH o PUT con el nuevo estado
    return this.http.patch<SolicitudAcceso>(`${this.apiUrl}/${id}`, { status: nuevoEstado });
  }

  // 4. DELETE (DELETE)
  eliminarSolicitud(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
