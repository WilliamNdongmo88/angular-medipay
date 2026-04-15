import { Component, inject } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss']
})
export class NotificationToastComponent {

  notificationService = inject(NotificationService);

  currentNotification = this.notificationService.notification;

  closeNotification() {
    this.notificationService.clear();
  }
}
