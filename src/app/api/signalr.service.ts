import * as signalR from '@microsoft/signalr';

const HUB_URL = 'http://localhost:5252/bookingHub';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private callbacks: { [event: string]: ((data: any) => void)[] } = {};

  async startConnection() {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log('SignalR Connected.');

      this.connection.on('NewBooking', (data) => {
        this.trigger('NewBooking', data);
      });

      this.connection.on('BookingStatusChanged', (data) => {
        this.trigger('BookingStatusChanged', data);
      });

    } catch (err) {
      console.error('SignalR Connection Error: ', err);
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (!this.callbacks[event]) return;
    this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
  }

  private trigger(event: string, data: any) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  }

  stopConnection() {
    this.connection?.stop();
  }
}

export const signalRService = new SignalRService();
