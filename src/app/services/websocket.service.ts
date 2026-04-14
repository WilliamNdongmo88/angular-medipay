import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';
import SockJS from 'sockjs-client';
import { User } from '../models/user.model';
import { Transaction } from '../models/transaction.model';
import { Wallet } from '../models/wallet.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService {

  private stompClient!: Client;
  transactions = signal<any[]>([]);
  users = signal<any[]>([]);
  wallets = signal<any[]>([]);

  private wsUrl: string | undefined;
  private isProd = environment.production;

  constructor() {
    // Définir l'URL de l'API selon l'environnement
    if (this.isProd) {
      this.wsUrl = environment.brokerURLProd;
    } else {
      this.wsUrl = environment.brokerURLDev;
    }
  }

  connect() {
    this.stompClient = new Client({
      brokerURL: this.wsUrl,
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

      // WebSocket pour l'historique des transactions du wallet
      this.stompClient.subscribe('/topic/wallets', (message) => {
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
          console.log('🔄 Transactions wallet mises à jour:', updatedList);
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
    };

    this.stompClient.activate();
  }

  disconnect() {
    this.stompClient.deactivate();
  }
}
