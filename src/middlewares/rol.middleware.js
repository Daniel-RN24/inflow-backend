import prisma from "../../prismaClient.js";
const checkRol = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (Number.isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "El id no es válido" });
    }

    const usuarios_id = parseInt(req.usuario.id);

    const modelo = req.path.split("/")[1];

    const existeRegistro = await prisma[modelo].findFirst({
      where: { id, usuarios_id },
    });

    // Validar que el usuario logueado si este realizando sus propias acciones

    if (!existeRegistro) {
      const error = new Error("Recurso no encontrado");
      return res.status(404).json({ msg: error.message });
    }

    next();
  } catch (error) {
    console.log(error);
  }
};

export default checkRol;
