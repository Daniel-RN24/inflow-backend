import prisma from "../../prismaClient.js";

export const getConceptos = async (req, res) => {
  try {
    // Variables principales
    const usuarios_id = req.usuario.id;

    // Leer parametros de paginas con valores por defecto
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Filtros de la api
    const { search, category } = req.query;

    let filters = {};

    if (search) {
      filters.nombre = {
        contains: search,
      };
    }

    if (category) {
      filters.categorias_id = parseInt(category);
    }

    const where = {
      usuarios_id,
      ...filters,
    };

    const [total, results] = await Promise.all([
      prisma.conceptos.count({ where }),
      prisma.conceptos.findMany({
        where,
        include: { categorias: true },
        take: limit,
        skip,
      }),
    ]);

    // Envio de resultados
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

export const getConceptoById = async (req, res) => {
  try {
    // Variables principales
    const id = parseInt(req.params.id);
    const usuarios_id = req.usuario.id;

    // Obtener el concepto y su categoria por el id
    const results = await prisma.conceptos.findFirst({
      where: { usuarios_id, id },
      include: {
        categorias: true,
      },
    });

    // Envio de resultados
    res.json(results);
  } catch (error) {
    console.log(error);
  }
};

export const createConcepto = async (req, res) => {
  try {
    // Variables principales
    const usuarios_id = req.usuario.id;
    const { nombre, categorias_id } = req.body;

    // Crear un concepto de acuerdo al usuario logueado
    const concepto = await prisma.conceptos.create({
      data: {
        nombre,
        categorias_id,
        usuarios_id,
      },
    });

    // Enviar la informacion
    res.status(201).json({
      data: concepto,
      success: true,
      message: "Concepto creado correctamente",
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Ya existe un concepto con ese nombre",
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "La categoría indicada no existe",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

export const updateConcepto = async (req, res) => {
  try {
    // Variables principales
    const id = parseInt(req.params.id);
    const { nombre, categorias_id } = req.body;

    // Actualizacion de la informacion
    const concepto = await prisma.conceptos.update({
      where: { id },
      data: {
        nombre,
        categorias_id,
      },
    });

    // Envio de resultados
    res.json({
      data: concepto,
      success: true,
      message: "Concepto actualizado correctamente",
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Ya existe un concepto con ese nombre",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

export const deleteConcepto = async (req, res) => {
  try {
    // Variables principales
    const id = parseInt(req.params.id);
    const usuarios_id = req.usuario.id;

    // Buscar si existe una transacion con un concepto
    const existeTransaccion = await prisma.transacciones.findFirst({
      where: { usuarios_id, conceptos_id: id },
    });

    // Verificar que la transaccion no cuente con un concepto asociado
    if (existeTransaccion) {
      const error = new Error("Ese concepto esta asociado a una transaccion");
      return res.status(403).json({ msg: error.message, success: false });
    }

    // Si no esta asociado a nada, se elimina
    const results = await prisma.conceptos.delete({ where: { id } });

    // Envio de resultados
    res.json(results);
  } catch (error) {
    console.log(error);
  }
};
