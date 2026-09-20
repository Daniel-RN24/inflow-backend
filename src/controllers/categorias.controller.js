import { categorias_tipo } from "@prisma/client";
import prisma from "../../prismaClient.js";

export const getCategorias = async (req, res) => {
  try {
    // Variabels principales
    const usuarios_id = req.usuario.id;

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
      ...filters,
      usuarios_id,
    };

    const [total, results] = await Promise.all([
      prisma.categorias.count({ where }),
      prisma.categorias.findMany({ where, take: limit, skip }),
    ]);

    // Envio de los resultados;
    res.json({
      data: results,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasPreviousPage: page > 1,
        hasNextPage: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
  }
};
export const getCategoriaById = async (req, res) => {
  try {
    // Variables principales
    const id = parseInt(req.params.id);
    const usuarios_id = parseInt(req.usuario.id);

    // Encontrar la categoria por id y usuario
    const results = await prisma.categorias.findFirst({
      where: { id, usuarios_id },
    });

    // Envio de la informacion
    res.json({ results });
  } catch (error) {
    console.log(error);
  }
};

export const createCategoria = async (req, res) => {
  try {
    // Variales principales
    const { nombre, tipo } = req.body;
    const usuarios_id = req.usuario.id;

    // Modificar el objeto antes de ejecutarlo con la bd
    const data = {
      nombre,
      usuarios_id,
      tipo: categorias_tipo[tipo],
    };

    // Crear el objeto dado en la base de datos
    const results = await prisma.categorias.create({ data });

    // Envio de la informacion
    res.json({ results });
  } catch (error) {
    console.log(error);
  }
};

export const updateCategoria = async (req, res) => {
  try {
    // Variales principales
    const { nombre, tipo } = req.body;
    const id = parseInt(req.params.id);

    // Modificacion del objeto antes de enviarlo
    const data = {
      nombre,
      tipo: categorias_tipo[tipo],
    };

    // Actualizacion de la informacion
    const results = await prisma.categorias.update({
      where: { id },
      data,
    });

    // Envio de los resultados;
    res.json({ results });
  } catch (error) {
    console.log(error);
  }
};

export const deleteCategoria = async (req, res) => {
  try {
    // Variables principales
    let id = parseInt(req.params.id);

    // Verificar que no exista un concepto asociado a una categoria
    const existeConcepto = await prisma.conceptos.findFirst({
      where: { categorias_id: id },
    });

    // Validar la decision
    if (existeConcepto) {
      const error = new Error("Esa categoria esta asociada a un concepto");
      return res.status(400).json({ msg: error.message, success: false });
    }

    // Eliminar la categoria si no esta asociado a ningun concepto
    const results = await prisma.categorias.delete({
      where: { id },
    });

    // Envio de la informacion
    res.json({ results });
  } catch (error) {
    console.log(error);
  }
};
