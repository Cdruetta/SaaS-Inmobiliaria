const authService = require('../services/authService');

class AuthController {
  // Register user
  async register(req, res) {
    try {
      const { email, password, name, role } = req.body;

      // Validation
      if (!email || !password || !name) {
        return res.status(400).json({
          error: 'Email, contraseña y nombre son requeridos'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      const result = await authService.register({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        role: role || 'AGENT'
      });

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email y contraseña son requeridos'
        });
      }

      const result = await authService.login(
        email.toLowerCase().trim(),
        password
      );

      res.json({
        message: 'Login exitoso',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(401).json({ error: error.message });
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const profile = await authService.getProfile(userId);

      res.json({ profile });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      const user = await authService.updateProfile(userId, updateData);

      res.json({
        message: 'Perfil actualizado exitosamente',
        user
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();
