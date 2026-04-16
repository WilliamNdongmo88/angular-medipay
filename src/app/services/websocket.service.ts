import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';
import SockJS from 'sockjs-client';
import { User } from '../models/user.model';
import { Transaction } from '../models/transaction.model';
import { Subject } from 'rxjs';
import { CommunicationService } from './share.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {

  private stompClient!: Client;
  transactions = signal<any[]>([]);
  users = signal<any[]>([]);
  notifications = signal<any[]>([]);
  userName = signal<string | null>(null);
  userId: number | null = null;

  private lastSoundTime = 0;
  private notificationSound = new Audio('sounds/notification.mp3');

  private wsUrl: string;
  private isProd = environment.production;

  constructor(
    private communicationService: CommunicationService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    // Définir l'URL de l'API selon l'environnement
    if (this.isProd) {
      this.wsUrl = environment.brokerURLProd;
    } else {
      this.wsUrl = environment.brokerURLDev;
    }

    const user = this.authService.currentUser();
    if (user) {
      this.userName.set(user.username);
      this.userId = user.id;
    }
  }

  connect() {
    this.stompClient = new Client({
      //brokerURL: this.wsUrl,
      webSocketFactory: () => new SockJS(this.wsUrl.replace('wss', 'https')),
      //webSocketFactory: () => new SockJS(this.wsUrl),
      reconnectDelay: 5000
    });


    this.stompClient.onConnect = () => {
      console.log('✅ WebSocket connecté');

      // WebSocket pour les transactions
      this.stompClient.subscribe('/topic/transactions', (message) => {
        const payload = JSON.parse(message.body);

        const transactions: Transaction[] = Array.isArray(payload)
          ? payload
          : [payload];

        this.transactions.update(list => {
          let updatedList = [...list];

          transactions.forEach(tx => {
            const index = updatedList.findIndex(t => t.id === tx.id);

            if (index !== -1) {
              updatedList[index] = tx; // update
            } else {
              updatedList.unshift(tx); // add
            }
          });
          console.log('🔄 Transactions mises à jour:', updatedList);
          return updatedList;
        });
      });

      // WebSocket pour les utilisateurs
      this.stompClient.subscribe('/topic/users', (message) => {
        const users: User[] = JSON.parse(message.body);
        console.log('📩 Users reçus:', users);

        this.users.update(list => {
          let updatedList = [...list];

          users.forEach(user => {
            const index = updatedList.findIndex(u => u.id === user.id);

            if (index !== -1) {
              // 🔁 UPDATE user existant
              updatedList[index] = user;
            } else {
              // ➕ AJOUT nouveau user
              updatedList.unshift(user);
            }
          });
          console.log('🔄 Liste mise à jour:', updatedList);
          return updatedList;
        });
      });

      // S'abonner aux notifications privées de l'utilisateur
      this.stompClient.subscribe(`/topic/notifications`, (notification: any) => {
        const data : any[] = JSON.parse(notification.body);
        console.log('🔔 Notification reçue:', data);
        this.showToast(data);
      });
    };

    this.stompClient.activate();
  }

  private showToast(data: any) {

    console.log("🔔 Notification reçue :", data);
    console.log("🔔 User ID ciblé :", data.receiverId, " | Type :", data.type);
    console.log("🔔 User ID actuel :", this.userId);

    // 🔊 jouer le son
    this.playSound();

    // 🔥 déclenche directement le toast global
    if (data?.type === 'DEPOSIT' && Number(data.receiverId) === this.userId) {
      this.notificationService.show({
        type: data.type,
        message: data.message,
        senderName: data.senderName
      });
    }else if (data?.type === 'PAYMENT' && Number(data.receiverId) === this.userId) {
      this.notificationService.show({
        type: data.type,
        message: data.message,
        senderName: data.senderName
      });
    }

    // (optionnel si tu veux garder communicationService)
    this.communicationService.triggerSenderAction(data);
  }

  private playSound() {
    try {
      this.notificationSound.currentTime = 0;
      this.notificationSound.play().catch(err => {
        console.warn('🔇 Son bloqué par le navigateur:', err);
      });
    } catch (e) {
      console.error('Erreur audio:', e);
    }
  }

  // private playSound() {
  //   const now = Date.now();

  //   // éviter spam (< 1s)
  //   if (now - this.lastSoundTime < 1000) return;

  //   this.lastSoundTime = now;

  //   this.notificationSound.currentTime = 0;
  //   this.notificationSound.play().catch(() => {});
  // }

  disconnect() {
    this.stompClient.deactivate();
  }
}
