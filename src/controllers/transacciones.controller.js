import { categorias_tipo, transacciones_estado } from "@prisma/client";
import { nowUTC } from "../helpers/date.js";
import prisma from "../../prismaClient.js";

export const getTransacciones = async (req, res) => {
  try {
    // Variables principales
    const usuarios_id = req.usuario.id;

    // Leer parametros de paginacion con valores por defecto
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Filtros de la API
    const { type, search, category, fromDate, untilDate } =
      req.query;

    let filters = {};

    if (search) {
      filters.OR = [
        { descripcion: { contains: search } },
        { conceptos: { nombre: { contains: search } } },
      ];
    }

    if (type) {
      filters.conceptos = {
        ...(filters.conceptos || {}),
        categorias: { tipo: type },
      };
    }

    if (category) {
      filters.conceptos = {
        ...(filters.conceptos || {}),
        categorias_id: parseInt(category),
      };
    }

    if (fromDate || untilDate) {
      filters.fecha = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(untilDate && { lte: new Date(untilDate) }),
      };
    }

    const where = {
      usuarios_id,
      estado: transacciones_estado.Activa,
      ...filters,
    };


    // Ejecutar ambas consultas en paralelo para eficiencia
    const [total, results] = await Promise.all([
      prisma.transacciones.count({ where }),
      prisma.transacciones.findMany({
        where,
        include: {
          cuentas: true,
          conceptos: { include: { categorias: true } },
        },
        orderBy: { fecha: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Enviar los resultados
    res.json({
      data: results,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const getTransaccionById = async (req, res) => {
  try {
    // Variables principales
    const usuarios_id = req.usuario.id;
    const id = parseInt(req.params.id);

    // Traer todas las transacciones con las cuentas, conceptos y categorias
    const results = await prisma.transacciones.findFirst({
      where: { usuarios_id, id },
      include: {
        cuentas: true,
        conceptos: {
          include: {
            categorias: true,
          },
        },
      },
    });

    // Enviar los resultados
    res.json(results);
  } catch (error) {
    console.log(error);
  }
};

export const createTransaccion = async (req, res) => {
  try {
    // Variables principales
    const usuarios_id = req.usuario.id;
    const { valor, descripcion, estado, cuentas_id, conceptos_id } = req.body;

    // Asignar la fecha actual y el usuario a la creacion de la transaccion
    const data = {
      fecha: nowUTC(),
      estado: transacciones_estado[estado],
      valor,
      descripcion,
      usuarios_id,
      cuentas_id,
      conceptos_id,
    };

    // Crear la transaccion
    const results = await prisma.transacciones.create({ data });

    // Enviar los resultados
    res.json({ results, success: true });
  } catch (error) {
    console.log(error);
  }
};

export const updateTransaccion = async (req, res) => {
  try {
    // Variables principales
    const id = parseInt(req.params.id);
    const { valor, descripcion, estado, cuentas_id, conceptos_id } = req.body;

    // Modificacion de la peticion
    const data = {
      fecha: nowUTC(),
      valor,
      descripcion,
      cuentas_id,
      conceptos_id,
      estado: transacciones_estado[estado],
    };

    // Actualizacion de la transaccion
    const results = await prisma.transacciones.update({ where: { id }, data });

    // Envio de resultados
    res.json({ results, success: true });
  } catch (error) {
    console.log(error);
  }
};

export const deleteTransaccion = async (req, res) => {
  try {
    // Variables principales
    const id = parseInt(req.params.id);

    // Anular la transaccion
    const results = await prisma.transacciones.update({
      where: { id },
      data: {
        estado: "Anulada",
      },
    });

    // Enviar los resultados
    res.json(results);
  } catch (error) {
    console.log(error);
  }
};

export const activeTransaccion = async (req, res) => {
  try {
    // Variables principales
    const id = parseInt(req.params.id);

    // Activar la transaccion
    const results = await prisma.transacciones.update({
      where: { id },
      data: {
        estado: "Activa",
      },
    });

    // Enviar los resultados
    res.json(results);
  } catch (error) {
    console.log(error);
  }
};
