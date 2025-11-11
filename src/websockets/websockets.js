export default (io) => {
    io.on("connection", (socket) => {
        console.log(`Nuevo cliente conectado: ${socket.id}`);

        // Aquí puedes escuchar eventos del cliente si lo necesitas
        // Por ejemplo, un admin moviendo un horario en un calendario
        // socket.on("admin_update_shift", (data) => {
        //     // ... lógica de DB ...
        //     // Y luego notificar a todos
        //     io.emit("shifts_updated", data); 
        // });

        socket.on("disconnect", () => {
            console.log(`Cliente desconectado: ${socket.id}`);
        });
    });
}