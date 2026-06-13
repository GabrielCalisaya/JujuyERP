import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ItemVenta {
  productoId: string;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class VentasService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:5075/api/ventas';

  registrarVenta(items: ItemVenta[]) {
    return this.http.post<{ id: string }>(this.API, { items }, { observe: 'response' });
  }
}
