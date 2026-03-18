import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../services/usuario.service';
import { Usuario } from '../../../models/usuario.model';
import { SearchInputComponent } from '../../shared/search-input/search-input.component';
import { UsuarioFormComponent } from './usuario-form/usuario-form.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, SearchInputComponent, UsuarioFormComponent],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private usuarioService = inject(UsuarioService);
  
  // Base data signals
  usuarios = signal<Usuario[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filter signals
  searchQuery = signal<string>('');
  roleFilter = signal<string>('ALL');

  // SELECT SIGNALS (Selection System)
  selectedIds = signal<Set<string>>(new Set());

  // DRAWER STATE: null = cerrado | Usuario = editar | 'NEW' = crear
  drawerOpen    = signal<boolean>(false);
  drawerUsuario = signal<Usuario | null>(null);

  // COMPUTEDS: Estado derivado de la selección
  isAllSelected = computed(() => {
    const visible = this.paginatedUsuarios();
    if (visible.length === 0) return false;
    return visible.every(u => this.selectedIds().has(u._id!));
  });

  someSelected = computed(() => this.selectedIds().size > 0);

  // LA MAGIA: El Computed Signal que gestiona el Filtrado y Ranking (Relaciones Fuertes)
  filteredUsuarios = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.roleFilter();
    const allUsers = this.usuarios();

    if (!query && filter === 'ALL') {
      return allUsers; // No hay filtros activos
    }

    return allUsers
      .filter(u => {
        const matchesRole = filter === 'ALL' || u.role === filter;
        const matchesSearch = !query || 
          u.fullName.toLowerCase().includes(query) || 
          u.email.toLowerCase().includes(query);
        
        return matchesRole && matchesSearch;
      })
      .sort((a, b) => {
        if (!query) return 0;

        // --- SISTEMA DE RANKING (Relaciones Fuertes) ---
        // 1. Prioridad: El nombre empieza exactamente por la búsqueda
        const aStarts = a.fullName.toLowerCase().startsWith(query) ? 1 : 0;
        const bStarts = b.fullName.toLowerCase().startsWith(query) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        // 2. Prioridad: La búsqueda está en el nombre (aunque no al inicio)
        const aInName = a.fullName.toLowerCase().includes(query) ? 1 : 0;
        const bInName = b.fullName.toLowerCase().includes(query) ? 1 : 0;
        if (aInName !== bInName) return bInName - aInName;

        return 0; // Mantener orden original (Mongo) para el resto
      });
  });

  // --- PAGINACIÓN ---
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  paginatedUsuarios = computed(() => {
    const all = this.filteredUsuarios();
    const page = this.currentPage();
    const size = this.pageSize();
    return all.slice((page - 1) * size, page * size);
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsuarios().length / this.pageSize()))
  );

  // Devuelve números de página con -1 como marcador de ellipsis
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const result: number[] = [1];
    if (current > 3) result.push(-1);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) result.push(i);
    if (current < total - 2) result.push(-1);
    result.push(total);
    return result;
  });

  ngOnInit(): void {
    this.fetchUsuarios();
  }

  fetchUsuarios(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.error.set('Error cargando usuarios.');
        this.isLoading.set(false);
      }
    });
  }

  // --- ACCIÓN FUNCIONAL: Eliminar Usuario ---
  confirmarEliminar(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      this.usuarioService.deleteUsuario(id).subscribe({
        next: () => {
          // ACTUALIZACIÓN FUNCIONAL:
          // Sencillamente filtramos la 'fuente de datos' original eliminando el ID.
          // Angular recalculará automáticamente el computed 'filteredUsuarios'.
          this.usuarios.update(actuales => actuales.filter(u => u._id !== id));
          
          console.log(`Usuario ${id} eliminado correctamente del backend y del signal.`);
        },
        error: (err) => {
          console.error('Error al intentar eliminar el usuario:', err);
          alert('No se pudo eliminar el usuario. Revisa la consola para más detalles.');
        }
      });
    }
  }

  // Métodos de actualización de filtros (resetean a página 1)
  updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  updateRole(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.roleFilter.set(value);
    this.currentPage.set(1);
  }

  // --- LÓGICA DE PAGINACIÓN ---
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  prevPage(): void { this.goToPage(this.currentPage() - 1); }
  nextPage(): void { this.goToPage(this.currentPage() + 1); }

  pageStart(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  pageEnd(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.filteredUsuarios().length);
  }

  // --- LÓGICA DE SELECCIÓN ---
  
  toggleSelection(id: string): void {
    this.selectedIds.update(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleAll(): void {
    const allPageIds = this.paginatedUsuarios().map(u => u._id!);
    this.selectedIds.update(prev => {
      if (this.isAllSelected()) {
        const next = new Set(prev);
        allPageIds.forEach(id => next.delete(id));
        return next;
      } else {
        return new Set([...prev, ...allPageIds]);
      }
    });
  }

  borrarSeleccionados(): void {
    const ids = Array.from(this.selectedIds());
    if (confirm(`¿Estás seguro de que quieres eliminar ${ids.length} usuarios?`)) {
      this.usuarios.update(actuales => actuales.filter(u => !this.selectedIds().has(u._id!)));
      this.clearSelection();
      console.log('Borrado masivo completado localmente.');
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // --- DRAWER ---

  abrirCrear(): void {
    this.drawerUsuario.set(null);
    this.drawerOpen.set(true);
  }

  abrirEditar(usuario: Usuario): void {
    this.drawerUsuario.set(usuario);
    this.drawerOpen.set(true);
  }

  cerrarDrawer(): void {
    this.drawerOpen.set(false);
  }

  onUsuarioGuardado(guardado: Usuario): void {
    this.usuarios.update(actuales => {
      const idx = actuales.findIndex(u => u._id === guardado._id);
      if (idx >= 0) {
        // Edición: reemplazamos el elemento existente
        const copia = [...actuales];
        copia[idx] = guardado;
        return copia;
      } else {
        // Creación: añadimos al principio para visibilidad inmediata
        return [guardado, ...actuales];
      }
    });
  }
}
