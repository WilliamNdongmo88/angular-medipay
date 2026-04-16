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

  private audioUnlocked = false;

  ngOnInit() {
    this.ws.connect(); // 🔥 UNE seule fois pour toute l'app

    const unlock = () => {
      if (this.audioUnlocked) return;

      const audio = new Audio('sounds/notification.mp3');
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        this.audioUnlocked = true;
        console.log('🔊 Audio débloqué');
      }).catch(() => {});

      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };

    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
  }

  // ngOnInit() {
  //   this.ws.connect(); // 🔥 UNE seule fois pour toute l'app

  //   // 🔥 débloquer audio après premier clic
  //   document.addEventListener('click', () => {
  //     const audio = new Audio();
  //     audio.play().catch(() => {});
  //   }, { once: true });
  // }
}
