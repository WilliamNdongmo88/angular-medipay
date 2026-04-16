import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationToastComponent } from "./components/notification/notification-toast.component";
import { WebSocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App {
  protected readonly title = signal('medipay-frontend');

  private ws = inject(WebSocketService);

  ngOnInit() {
    this.ws.connect(); // 🔥 UNE seule fois pour toute l'app

    // 🔥 débloquer audio après premier clic
    document.addEventListener('click', () => {
      const audio = new Audio();
      audio.play().catch(() => {});
    }, { once: true });
  }
}
