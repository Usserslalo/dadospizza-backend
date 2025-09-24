// src/controllers/users.controller.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Función para registrar un nuevo usuario
const register = async (req, res) => {
  try {
    const { email, name, lastname, phone, password } = req.body;

    // Validar que se proporcionen todos los campos requeridos
    if (!email || !name || !lastname || !phone || !password) {
      return res.status(400).json({ 
        error: 'Todos los campos son obligatorios: email, name, lastname, phone, password' 
      });
    }

    // Verificar si ya existe un usuario con el mismo email o teléfono
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'El correo o teléfono ya están registrados' 
      });
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Usar transacción para crear usuario y asignar rol
    const result = await prisma.$transaction(async (tx) => {
      // Crear el nuevo usuario
      const newUser = await tx.users.create({
        data: {
          email,
          name,
          lastname,
          phone,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Buscar el rol 'CLIENTE'
      const clientRole = await tx.roles.findFirst({
        where: { name: 'CLIENTE' }
      });

      if (!clientRole) {
        throw new Error('Rol CLIENTE no encontrado en la base de datos');
      }

      // Asignar el rol al usuario
      await tx.user_has_roles.create({
        data: {
          id_user: newUser.id,
          id_rol: clientRole.id,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      return newUser;
    });

    // Respuesta exitosa con información de rol
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: result.id.toString(),
        email: result.email,
        name: result.name,
        lastname: result.lastname,
        phone: result.phone,
        role: 'CLIENTE', // Los usuarios registrados siempre son CLIENTE
        id_branch: null, // Los clientes no tienen sucursal
        created_at: result.created_at
      }
    });

  } catch (error) {
    console.error('Error en el registro de usuario:', error);
    
    // Manejar errores específicos
    if (error.message === 'Rol CLIENTE no encontrado en la base de datos') {
      return res.status(500).json({ 
        error: 'Error de configuración: Rol CLIENTE no encontrado' 
      });
    }

    // Error genérico del servidor
    res.status(500).json({ 
      error: 'Error interno del servidor al crear el usuario' 
    });
  }
};

// Función para iniciar sesión
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que se proporcionen email y password
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son obligatorios' 
      });
    }

    // Buscar usuario por email con sus roles
    const user = await prisma.users.findUnique({
      where: { email: email },
      include: {
        user_has_roles: {
          include: {
            roles: true
          }
        },
        branches: true
      }
    });

    // Si no se encuentra el usuario, devolver error genérico por seguridad
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Si la contraseña no coincide, devolver error genérico por seguridad
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Generar JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Obtener el rol principal del usuario (asumimos que tiene un solo rol)
    const userRole = user.user_has_roles[0]?.roles?.name || 'CLIENTE';
    
    // Respuesta exitosa con información de rol
    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token: token,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        phone: user.phone,
        role: userRole,
        id_branch: user.id_branch ? user.id_branch.toString() : null
      }
    });

  } catch (error) {
    console.error('Error en el login de usuario:', error);
    
    // Error genérico del servidor
    res.status(500).json({ 
      error: 'Error interno del servidor al iniciar sesión' 
    });
  }
};

// Función para obtener el perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    // Obtener el userId del middleware de autenticación
    const { userId } = req.user;

    // Buscar al usuario en la base de datos con sus roles
    const user = await prisma.users.findUnique({
      where: {
        id: BigInt(userId)
      },
      include: {
        user_has_roles: {
          include: {
            roles: true
          }
        },
        branches: true
      }
    });

    // Si no se encuentra el usuario
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Obtener el rol principal del usuario
    const userRole = user.user_has_roles[0]?.roles?.name || 'CLIENTE';
    
    // Respuesta exitosa con los datos del perfil incluyendo rol
    res.status(200).json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        phone: user.phone,
        role: userRole,
        id_branch: user.id_branch ? user.id_branch.toString() : null,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Error al obtener el perfil del usuario:', error);
    
    // Error genérico del servidor
    res.status(500).json({
      error: 'Error interno del servidor al obtener el perfil'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
