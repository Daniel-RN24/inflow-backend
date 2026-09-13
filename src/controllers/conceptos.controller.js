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

    // Agregar al req.body el usuario_id
    const data = {
      nombre,
      categorias_id,
      usuarios_id,
    };

    // Crear un concepto de acuerdo al usuario logueado
    const results = await prisma.conceptos.create({ data });

    // Enviar la informacion
    res.json({ results, success: true });
  } catch (error) {
    console.log(error);
  }
};

export const updateConcepto = async (req, res) => {
  try {
    // Variables principales
    const id = parseInt(req.params.id);
    const { nombre, categorias_id } = req.body;

    // Objeto para la accion de la bd
    const data = {
      nombre,
      categorias_id,
    };

    // Actualizacion de la informacion
    const results = await prisma.conceptos.update({ where: { id }, data });

    // Envio de resultados
    res.json({ results, success: true });
  } catch (error) {
    console.log(error);
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
