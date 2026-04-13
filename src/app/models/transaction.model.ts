export interface Transaction {
  id: number;
  amount: number;
  type: 'DEPOSIT' | 'PAYMENT' | 'RESET';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: String;
  timestamp: Date;
  senderName: String;
  receiverName: String;
  senderBalance: number;
  receiverBalance: number;
}
