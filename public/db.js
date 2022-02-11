let db;

const request = window.indexedDB.open("offlineDB", 5);
// new or updated db
request.onupgradeneeded = function (e) {
  console.log("upgrade needed");
  db = request.result;
  if (db.objectStoreNames.length === 0) {
    store = db.createObjectStore("transactionStore", { autoIncrement: true });
  }
};

// if error
request.onerror = function (e) {
  console.log("Error:", e.target);
};

function handleOnline() {
  console.log("handleonline");
  const transaction = db.transaction(["transactionStore"], "readwrite");
  const store = transaction.objectStore("transactionStore");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            const transaction = db.transaction(["transactionStore"], "readwrite");
            const currentStore = transaction.objectStore("transactionStore");
            currentStore.clear();
          }
        });
    }
  };
}

// success
request.onsuccess = function (e) {
  console.log("request-success");
  db = request.result;
  if (navigator.onLine) {
    console.log("navigator online");
    handleOnline();
  }

  // db.onerror = function (e) {
  //   console.log("ERROR", e.target.errorCode);
  // };
};

// save record, (invoked from failed api/transaction)
const saveRecord = (record) => {
  console.log("save record function");
  const transaction = db.transaction(["transactionStore"], "readwrite");
  const store = transaction.objectStore("transactionStore");
  store.add(record);
};

// Events
window.addEventListener("online", handleOnline);