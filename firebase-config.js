/* Add the Firebase Web App config from the Firebase console.
   The config is public client metadata; protect the database with Firebase
   Realtime Database Security Rules instead of putting secrets in this file. */
window.ECOWASTE_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

(function () {
  const STORAGE_KEY = "ecowaste:pickupRequests";
  const LAST_REQUEST_KEY = "ecowaste:lastRequestId";
  const channel = "BroadcastChannel" in window
    ? new BroadcastChannel("ecowaste:pickupRequests")
    : null;
  let database = null;
  let requestsRef = null;
  let firebaseReady = false;

  function hasFirebaseConfig(config) {
    return config && config.apiKey && config.databaseURL && config.projectId && config.appId;
  }

  function normalizeRequest(request) {
    return {
      id: request.id,
      name: request.name || "",
      phone: request.phone || "",
      address: request.address || "",
      category: request.category || "",
      quantity: request.quantity || "",
      status: request.status || "pending",
      createdAt: request.createdAt || new Date().toISOString(),
      updatedAt: request.updatedAt || request.createdAt || new Date().toISOString()
    };
  }

  function readLocalRequests() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map(normalizeRequest);
    } catch (error) {
      console.error("Unable to read local pickup requests.", error);
      return [];
    }
  }

  function writeLocalRequests(requests) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    if (channel) channel.postMessage("changed");
  }

  function notifyLocalSubscribers() {
    window.dispatchEvent(new CustomEvent("ecowaste:requests-changed"));
  }

  function getFirebaseRequests(snapshot) {
    const data = snapshot.val() || {};
    return Object.keys(data).map(function (id) {
      return normalizeRequest(Object.assign({}, data[id], { id: id }));
    });
  }

  if (hasFirebaseConfig(window.ECOWASTE_FIREBASE_CONFIG) && window.firebase) {
    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(window.ECOWASTE_FIREBASE_CONFIG);
      }
      database = window.firebase.database();
      requestsRef = database.ref("pickupRequests");
      firebaseReady = true;
    } catch (error) {
      console.error("Firebase could not be initialized. Using local sync instead.", error);
    }
  }

  window.EcoWasteStore = {
    isRealtime: function () {
      return firebaseReady;
    },

    createRequest: function (request) {
      const id = "REQ-" + Date.now().toString(36).toUpperCase();
      const newRequest = normalizeRequest(Object.assign({}, request, {
        id: id,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      if (firebaseReady) {
        return requestsRef.child(id).set(newRequest).then(function () {
          localStorage.setItem(LAST_REQUEST_KEY, id);
          return newRequest;
        });
      }

      const requests = readLocalRequests();
      requests.push(newRequest);
      writeLocalRequests(requests);
      localStorage.setItem(LAST_REQUEST_KEY, id);
      notifyLocalSubscribers();
      return Promise.resolve(newRequest);
    },

    updateStatus: function (id, status) {
      const updatedAt = new Date().toISOString();
      if (firebaseReady) {
        return requestsRef.child(id).update({ status: status, updatedAt: updatedAt });
      }

      const requests = readLocalRequests().map(function (request) {
        return request.id === id
          ? Object.assign({}, request, { status: status, updatedAt: updatedAt })
          : request;
      });
      writeLocalRequests(requests);
      notifyLocalSubscribers();
      return Promise.resolve();
    },

    subscribe: function (callback) {
      if (firebaseReady) {
        const listener = requestsRef.on("value", function (snapshot) {
          callback(getFirebaseRequests(snapshot));
        }, function (error) {
          console.error("Unable to read pickup requests from Firebase.", error);
        });
        return function () {
          requestsRef.off("value", listener);
        };
      }

      const render = function () {
        callback(readLocalRequests());
      };
      const onStorage = function (event) {
        if (event.key === STORAGE_KEY) render();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener("ecowaste:requests-changed", render);
      if (channel) channel.addEventListener("message", render);
      render();
      return function () {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("ecowaste:requests-changed", render);
        if (channel) channel.removeEventListener("message", render);
      };
    },

    getLastRequestId: function () {
      return localStorage.getItem(LAST_REQUEST_KEY);
    }
  };
})();
