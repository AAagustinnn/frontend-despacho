import http from "node:http";

const port = Number(process.env.PORT || 8080);
const serviceName = process.env.SERVICE_NAME || "backend";

let ventas = [
  {
    idVenta: 1001,
    direccionCompra: "Av. Libertador Bernardo O'Higgins 1234, Santiago",
    fechaCompra: "2026-06-20",
    valorCompra: 74990,
    despachoGenerado: false,
  },
  {
    idVenta: 1002,
    direccionCompra: "Av. Providencia 2211, Providencia",
    fechaCompra: "2026-06-22",
    valorCompra: 129990,
    despachoGenerado: false,
  },
  {
    idVenta: 1003,
    direccionCompra: "Los Carrera 455, Concepcion",
    fechaCompra: "2026-06-24",
    valorCompra: 46990,
    despachoGenerado: true,
  },
];

let despachos = [
  {
    idDespacho: 5001,
    idCompra: 1003,
    direccionCompra: "Los Carrera 455, Concepcion",
    valorCompra: 46990,
    fechaDespacho: "2026-06-26",
    patenteCamion: "ABCD12",
    intento: 1,
    entregado: false,
  },
];

const readJson = (request) =>
  new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });

const send = (response, statusCode, data) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Accept",
  });
  response.end(JSON.stringify(data));
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  console.log(`${serviceName} ${request.method} ${url.pathname}`);

  if (request.method === "OPTIONS") {
    send(response, 204, {});
    return;
  }

  if (url.pathname === "/health") {
    send(response, 200, { status: "ok", service: serviceName });
    return;
  }

  try {
    if (url.pathname === "/api/v1/ventas" && request.method === "GET") {
      send(response, 200, ventas);
      return;
    }

    const ventaMatch = url.pathname.match(/^\/api\/v1\/ventas\/(\d+)$/);
    if (ventaMatch && request.method === "PUT") {
      const idVenta = Number(ventaMatch[1]);
      const payload = await readJson(request);
      ventas = ventas.map((venta) =>
        venta.idVenta === idVenta ? { ...venta, ...payload } : venta,
      );
      send(response, 200, ventas.find((venta) => venta.idVenta === idVenta));
      return;
    }

    if (url.pathname === "/api/v1/despachos" && request.method === "GET") {
      send(response, 200, despachos);
      return;
    }

    if (url.pathname === "/api/v1/despachos" && request.method === "POST") {
      const payload = await readJson(request);
      const despacho = {
        ...payload,
        idDespacho: despachos.length
          ? Math.max(...despachos.map((item) => item.idDespacho)) + 1
          : 5001,
      };
      despachos = [...despachos, despacho];
      send(response, 201, despacho);
      return;
    }

    const despachoMatch = url.pathname.match(/^\/api\/v1\/despachos\/(\d+)$/);
    if (despachoMatch && request.method === "PUT") {
      const idDespacho = Number(despachoMatch[1]);
      const payload = await readJson(request);
      despachos = despachos.map((despacho) =>
        despacho.idDespacho === idDespacho
          ? {
              ...despacho,
              intento: Number(payload.intento ?? despacho.intento),
              entregado: payload.despachado === "true" || payload.entregado === true,
            }
          : despacho,
      );
      send(
        response,
        200,
        despachos.find((despacho) => despacho.idDespacho === idDespacho),
      );
      return;
    }

    send(response, 404, { error: "Not found", service: serviceName });
  } catch (error) {
    console.error(error);
    send(response, 400, { error: "Invalid request", service: serviceName });
  }
});

server.listen(port, () => {
  console.log(`${serviceName} listening on port ${port}`);
});
