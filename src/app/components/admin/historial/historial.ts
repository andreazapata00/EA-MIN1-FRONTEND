import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importem per fer servir *ngFor, *ngIf i el format de data
import { FormsModule } from '@angular/forms'; // Importem per fer servir [(ngModel)] al cercador
import { HistorialService } from '../../../services/historial.service';
import { Historial } from '../../../models/historial.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
})

export class HistorialComponent implements OnInit {
  // Variables que l'HTML està buscant:
  historials: Historial[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  limit: number = 5;
  searchTerm: string = '';

  constructor(private historialService: HistorialService) {}

  ngOnInit(): void {
    this.carregarHistorials();
  }

  // Mètode per demanar les dades al backend
  carregarHistorials(): void {
    this.historialService.getHistorials(this.currentPage, this.limit, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.historials = response.data;
          this.totalPages = response.totalPages;
          this.currentPage = response.page;
        },
        error: (err) => console.error('Error al carregar historials', err)
      });
  }

  // Mètode que crida el botó "Buscar"
  onSearch(): void {
    this.currentPage = 1;
    this.carregarHistorials();
  }

  // Mètode que criden els botons de Paginació
  canviarPagina(novaPagina: number): void {
    if (novaPagina >= 1 && novaPagina <= this.totalPages) {
      this.currentPage = novaPagina;
      this.carregarHistorials();
    }
  }

  // Mètode per esborrar un registre
  esborrarRegistre(id: string): void {
    if (confirm('Estàs segur que vols esborrar aquest registre d\'auditoria?')) {
      this.historialService.deleteHistorial(id).subscribe({
        next: () => this.carregarHistorials(),
        error: (err) => console.error('Error al esborrar', err)
      });
    }
  }
}

