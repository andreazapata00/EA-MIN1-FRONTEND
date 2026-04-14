export interface Canvi {
  campo: string;
  valorAnterior: any;
  valorNuevo: any;
}

export interface Historial {
  _id: string;
  ofertaId: any; 
  fecha: string;
  canvis: Canvi[];
}


export interface HistorialPaginatedResponse {
  total: number;
  page: number;
  totalPages: number;
  data: Historial[];
}