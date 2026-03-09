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
  _preferredCode: null,
  _takingOver: false,
  _retryTimer: null,
  _adminBC: null,
  _viewerConn: null,   // viewer's connection back to host
  _onViewerData: null, // callback when host receives data from a viewer

  // ------------------------------------------------------------------
  // HOST — called by the interview app
  // preferredCode (optional): if supplied, always try to use that exact code
  // ------------------------------------------------------------------
  startHost(preferredCode = null) {
    return new Promise((resolve, reject) => {
      if (this._hostReady && this.peer && !this.peer.destroyed) {
        // Already running with the same code — done
        if (!preferredCode || this._code === preferredCode.toUpperCase()) {
          resolve(this._code);
          return;
        }
        // Different code requested — tear down and restart
        this.peer.destroy();
        this.peer = null;
        this._hostReady = false;
        this._hostStarting = false;
        this.connections = [];
      }
      if (this._hostStarting) {
        // Already starting, poll until ready
        const wait = setInterval(() => {
          if (this._hostReady) { clearInterval(wait); resolve(this._code); }
        }, 100);
        return;
      }

      this._hostStarting = true;

      let code;
      if (preferredCode && preferredCode.length >= 4) {
        code = preferredCode.toUpperCase().slice(0, 6).padEnd(6, '0');
        localStorage.setItem('dartsRoomCode', code);
        this._preferredCode = code;
      } else {
        code = localStorage.getItem('dartsRoomCode');
        if (!code || code.length !== 6) {
          code = Math.random().toString(36).slice(2, 8).toUpperCase();
          localStorage.setItem('dartsRoomCode', code);
        }
        this._preferredCode = null;
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
        this._setupAdminChannel(p);
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
        conn.on('data', (msg) => {
          if (msg && msg.type === 'admin-takeover') {
            console.log('[PeerSync] Takeover requested — releasing AADS40 to new session');
            this._hostReady = false;
            this._hostStarting = false;
            this.connections.forEach(c => { try { c.close(); } catch (x) {} });
            this.connections = [];
            if (this._adminBC) { this._adminBC.close(); this._adminBC = null; }
            p.destroy();
          } else if (this._onViewerData) {
            this._onViewerData(msg);
          }
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
          if (this._preferredCode) {
            // Fixed admin code is temporarily busy (another tab/session) — keep retrying every 5s
            p.destroy();
            if (this._takingOver) return; // takeover in progress — _finishTakeover will restart
            console.warn('[PeerSync] Fixed code busy, retrying in 5s…');
            this._retryTimer = setTimeout(() => {
              this._retryTimer = null;
              if (!this._takingOver && !this._hostReady) {
                this._createPeer(this._preferredCode, resolve, reject);
              }
            }, 5000);
            return;
          }
          // No preferred code — try a fresh random code
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
  // TAKEOVER — new admin session signals old host to release AADS40
  // ------------------------------------------------------------------

  _setupAdminChannel(peer) {
    if (this._adminBC) this._adminBC.close();
    try {
      this._adminBC = new BroadcastChannel('aads_admin_ctrl');
      this._adminBC.onmessage = (e) => {
        if (e.data && e.data.type === 'admin-takeover') {
          console.log('[PeerSync] Same-device takeover — releasing AADS40');
          this._hostReady = false;
          this._hostStarting = false;
          this.connections.forEach(c => { try { c.close(); } catch (x) {} });
          this.connections = [];
          this._adminBC.close();
          this._adminBC = null;
          if (peer && !peer.destroyed) peer.destroy();
        }
      };
    } catch (e) { /* BroadcastChannel not supported */ }
  },

  /** Called on successful password entry — takes AADS40 from any existing session */
  requestTakeover(preferredCode) {
    const code = (preferredCode || this._preferredCode || '').toUpperCase().slice(0, 6).padEnd(6, '0');
    if (!code || code === '000000') return;
    // If THIS tab is already the host on this code, nothing to take over
    if (this.isHostActive() && this._code === code) return;

    // 1. Same-device signal via BroadcastChannel (instant for same-browser tabs)
    try {
      const bc = new BroadcastChannel('aads_admin_ctrl');
      bc.postMessage({ type: 'admin-takeover' });
      setTimeout(() => bc.close(), 500);
    } catch (e) { /* ignore */ }

    // 2. Cross-device signal via PeerJS — connect to current host and ask it to step down
    this._takingOver = true;
    if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }

    try {
      const tempPeer = new Peer(null, { debug: 0 });
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        try { tempPeer.destroy(); } catch (x) {}
        this._finishTakeover(code);
      };

      tempPeer.on('open', () => {
        const conn = tempPeer.connect('darts-' + code, { reliable: true, serialization: 'json' });
        conn.on('open', () => {
          conn.send({ type: 'admin-takeover' });
          // Give the old host time to destroy, then claim the code
          setTimeout(finish, 1200);
        });
        conn.on('error', finish);
        setTimeout(finish, 3000); // safety timeout
      });

      tempPeer.on('error', finish);
      setTimeout(finish, 4000); // outer safety timeout

    } catch (e) {
      this._finishTakeover(code);
    }
  },

  _finishTakeover(code) {
    if (this.peer && !this.peer.destroyed) { this.peer.destroy(); this.peer = null; }
    if (this._adminBC) { this._adminBC.close(); this._adminBC = null; }
    this._hostReady = false;
    this._hostStarting = false;
    this._takingOver = false;
    this.connections = [];
    // Now immediately claim AADS40 as the new host
    this.startHost(code).catch(() => {});
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
        this._viewerConn = conn;

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
          if (this._viewerConn === conn) this._viewerConn = null;
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

  /** Send a message from viewer back to the host */
  sendToHost(data) {
    if (this._viewerConn && this._viewerConn.open) {
      try { this._viewerConn.send(data); } catch (e) {}
    }
  },

  /** Register a callback on the HOST side to receive messages sent by viewers */
  onViewerMessage(callback) {
    this._onViewerData = callback;
  },

  disconnectViewer() {
    if (this.peer && !this.peer.destroyed) this.peer.destroy();
    this._viewerConn = null;
    this.peer = null;
    localStorage.removeItem('dartsViewerCode');
  }
};

if (typeof window !== 'undefined') {
  window.PeerSync = PeerSync;
}
