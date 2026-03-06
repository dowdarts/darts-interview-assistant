// PeerSync - Token-free P2P sync for AADS Darts
// Uses PeerJS (WebRTC) so the interview app can push live data
// directly to TV displays with just a 6-character pairing code.
//
// HOST  = interview app   → calls PeerSync.startHost()
// CLIENT = TV display     → calls PeerSync.connectAsViewer(code, onData, onStatus)

const PeerSync = {
  peer: null,
  connections: [],   // active DataConnections (host side)
  _code: null,
  _lastData: null,
  _hostStarting: false,
  _hostReady: false,

  // ------------------------------------------------------------------
  // HOST — called by the interview app
  // ------------------------------------------------------------------
  startHost() {
    return new Promise((resolve, reject) => {
      if (this._hostReady && this.peer && !this.peer.destroyed) {
        resolve(this._code);
        return;
      }
      if (this._hostStarting) {
        // Already starting, poll until ready
        const wait = setInterval(() => {
          if (this._hostReady) { clearInterval(wait); resolve(this._code); }
        }, 100);
        return;
      }

      this._hostStarting = true;

      // Restore or generate a 6-char uppercase code
      let code = localStorage.getItem('dartsRoomCode');
      if (!code || code.length !== 6) {
        code = Math.random().toString(36).slice(2, 8).toUpperCase();
        localStorage.setItem('dartsRoomCode', code);
      }
      this._code = code;

      this._createPeer(code, resolve, reject);
    });
  },

  _createPeer(code, resolve, reject) {
    const peerId = 'darts-' + code;

    try {
      const p = new Peer(peerId, {
        // Uses the free PeerJS cloud signalling server
        debug: 0
      });

      p.on('open', (id) => {
        this.peer = p;
        this._hostReady = true;
        this._hostStarting = false;
        console.log('[PeerSync] Host ready, code:', code, 'peer:', id);
        resolve(code);
      });

      p.on('connection', (conn) => {
        console.log('[PeerSync] Viewer connected:', conn.peer);
        conn.on('open', () => {
          this.connections.push(conn);
          // Send the latest data immediately so the TV updates right away
          if (this._lastData) conn.send(this._lastData);
        });
        conn.on('close', () => {
          this.connections = this.connections.filter(c => c !== conn);
          console.log('[PeerSync] Viewer disconnected, remaining:', this.connections.length);
        });
        conn.on('error', () => {
          this.connections = this.connections.filter(c => c !== conn);
        });
      });

      p.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // Code already in use — generate a fresh one
          const newCode = Math.random().toString(36).slice(2, 8).toUpperCase();
          localStorage.setItem('dartsRoomCode', newCode);
          this._code = newCode;
          this._hostStarting = false;
          p.destroy();
          this._createPeer(newCode, resolve, reject);
        } else {
          this._hostStarting = false;
          this._hostReady = false;
          console.error('[PeerSync] Host error:', err);
          reject(err);
        }
      });

      p.on('disconnected', () => {
        console.warn('[PeerSync] Host lost signalling server connection — attempting reconnect');
        if (!p.destroyed) p.reconnect();
      });

    } catch (e) {
      this._hostStarting = false;
      reject(e);
    }
  },

  getCode() { return this._code; },

  isHostActive() {
    return this._hostReady && this.peer && !this.peer.destroyed;
  },

  connectedViewers() {
    this.connections = this.connections.filter(c => c.open);
    return this.connections.length;
  },

  broadcast(data) {
    this._lastData = data;
    const open = this.connections.filter(c => c.open);
    open.forEach(conn => {
      try { conn.send(data); } catch (e) { /* ignore */ }
    });
    return open.length;
  },

  /** Generate a new pairing code (e.g. if you want to reset the room) */
  resetCode() {
    localStorage.removeItem('dartsRoomCode');
    if (this.peer && !this.peer.destroyed) this.peer.destroy();
    this.peer = null;
    this.connections = [];
    this._code = null;
    this._hostReady = false;
    this._hostStarting = false;
  },

  // ------------------------------------------------------------------
  // CLIENT — called by TV display pages
  // ------------------------------------------------------------------

  /**
   * Connect to a host using a 6-char pairing code.
   *
   * @param {string}   code       - 6-char code shown on the interview app
   * @param {Function} onData     - called with the event data object when received
   * @param {Function} onStatus   - called with status string:
   *                                'connecting' | 'connected' | 'disconnected' | 'error'
   */
  connectAsViewer(code, onData, onStatus) {
    const hostId = 'darts-' + code.trim().toUpperCase();

    // Tear down any existing peer
    if (this.peer && !this.peer.destroyed) this.peer.destroy();

    const viewerId = 'viewer-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    onStatus('connecting');

    try {
      const p = new Peer(viewerId, { debug: 0 });

      p.on('open', () => {
        this.peer = p;
        const conn = p.connect(hostId, { reliable: true, serialization: 'json' });

        conn.on('open', () => {
          console.log('[PeerSync] Connected to host:', hostId);
          onStatus('connected');
          // Store the code so we can reconnect after reload
          localStorage.setItem('dartsViewerCode', code.trim().toUpperCase());
        });

        conn.on('data', (data) => {
          onData(data);
        });

        conn.on('close', () => {
          onStatus('disconnected');
        });

        conn.on('error', (err) => {
          console.error('[PeerSync] Connection error:', err);
          onStatus('error');
        });
      });

      p.on('error', (err) => {
        console.error('[PeerSync] Viewer peer error:', err);
        onStatus('error');
      });

      p.on('disconnected', () => {
        onStatus('disconnected');
        if (!p.destroyed) p.reconnect();
      });

    } catch (e) {
      onStatus('error');
    }
  },

  disconnectViewer() {
    if (this.peer && !this.peer.destroyed) this.peer.destroy();
    this.peer = null;
    localStorage.removeItem('dartsViewerCode');
  }
};

if (typeof window !== 'undefined') {
  window.PeerSync = PeerSync;
}
