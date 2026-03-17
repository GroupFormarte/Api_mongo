"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushToWSClients = exports.removeClient = exports.addClient = void 0;
const ws_1 = require("ws");
let clients = [];
const addClient = (ws) => {
    clients.push(ws);
};
exports.addClient = addClient;
const removeClient = (ws) => {
    clients = clients.filter((client) => client !== ws);
};
exports.removeClient = removeClient;
const pushToWSClients = (data) => {
    console.log(`📡 Enviando a ${clients.length} clientes:`, data); // ← confirma
    const message = JSON.stringify(data);
    clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(message);
        }
    });
};
exports.pushToWSClients = pushToWSClients;
