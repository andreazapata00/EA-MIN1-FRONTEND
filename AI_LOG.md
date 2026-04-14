Pregunta 
Com crear un component d'Angular per visualitzar els historials en una taula amb paginació i cerca des del servidor.

Prompt
Crea un servei i un component per a la ruta /admin/historials., 

errors: Can't bind to 'ngModel' i el *ngFor no funciona., 

L'ID de l'oferta es veu com [object Object].



Incoherències
La IA proporciona codi per a un component clàssic (per a AppModule), però el meu projecte fa servir Standalone Components. Això va causar errors perquè faltaven imports clau com CommonModule i FormsModule. La URL del servei no incloïa la barra final (/), provocant un error 404 en les peticions.

Solució
Convertir manualment el component a standalone: true i vaig afegir les importacions necessàries a l'array imports del fitxer .ts. Corregir la lògica de la plantilla HTML per accedir a historial.ofertaId?.sector per evitar l'error. Finalment, vaig ajustar la URL del servei a http://localhost:4000/api/historials/ per resoldre el 404.