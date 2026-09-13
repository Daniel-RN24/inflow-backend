import { cuentas_tipo } from "@prisma/client";
import prisma from "../../prismaClient.js";

export const getCuentas = async (req, res) => {
  try {
    // Variables principales
    const usuarios_id = req.usuario.id;

    // Obtener variables de paginacion
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, type } = req.query;

    const filters = {};

    if (search) {
      filters.nombre = {
        contains: search,
      };
    }

    if (type) {
      filters.tipo = type;
    }

    const where = {
      usuarios_id,
      ...filters,
    };

    const [total, results] = await Promise.all([
      prisma.cuentas.count({ where }),
      prisma.cuentas.findMany({
        where,
        take: limit,
        skip,
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
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const getCuentaById = async (req, res) => {
  try {
    // Variables principales
    const id = parseInt(req.params.id);
    const usuarios_id = parseInt(req.usuario.id);

    // Obtener las cuent  asociada a dicho usuario
    const results = await prisma.cuentas.findFirst({
      where: { id, usuarios_id },
    });

    // Enviar los resultados
    res.json({ results });
  } catch (error) {
    console.log(error);
  }
};

export const createCuenta = async (req, res) => {
  try {
    // Variables principales
    const { nombre, tipo, saldo_inicial } = req.body;
    const id = parseInt(req.usuario.id);

    // Modificar la peticion para agregar el estado
    const data = {
      nombre,
      saldo_inicial,
      tipo: cuentas_tipo[tipo],
      usuarios_id: id,
    };

    // Crear una cuenta (dinero)
    const results = await prisma.cuentas.create({ data });

    // Enviar los resultados
    res.json({ results });
  } catch (error) {
    console.log(error);
  }
};

export const updateCuenta = async (req, res) => {
  try {
    // Variables principales
    let id = parseInt(req.params.id);
    const { nombre, tipo, saldo_inicial } = req.body;

    // Modificar la peticion para incluir el estado
    const data = {
      nombre,
      saldo_inicial,
      tipo: cuentas_tipo[tipo],
    };

    // Actualizar el registro
    const results = await prisma.cuentas.update({
      where: { id },
      data,
    });

    // Enviar los resultados
    res.json({ results });
  } catch (error) {
    console.log(error);
  }
};

export const deleteCuenta = async (req, res) => {
  try {
    // Variables globales
    let id = parseInt(req.params.id);

    // Validacion en la base de datos
    const existeTransaccion = await prisma.transacciones.findFirst({
      where: { cuentas_id: id },
    });

    // Verificar que la cuenta no este asociada a una transaccion
    if (existeTransaccion) {
      const error = new Error("Esa cuenta esta asociada a una transaccion");
      return res.status(403).json({ msg: error.message, success: false });
    }

    // Eliminar el registro
    const results = await prisma.cuentas.delete({
      where: { id },
    });

    // Enviar los resultados
    res.json({ results });
  } catch (error) {
    console.log(error);
  }
};
