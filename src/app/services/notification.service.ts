import { Injectable, signal } from '@angular/core';

export interface Notification {
  type: 'DEPOSIT' | 'PAYMENT';
  message: string;
  senderName?: string; // Optionnel, pour afficher le nom de l'expéditeur dans la notification
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private _notification = signal<Notification | null>(null);

  notification = this._notification.asReadonly();

  show(notification: Notification) {
    this._notification.set(notification);

    // auto hide après 15s
    setTimeout(() => this.clear(), 15000);
  }

  clear() {
    this._notification.set(null);
  }
}
