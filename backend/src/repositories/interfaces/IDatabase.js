/**
 * Interfaz para operaciones de base de datos
 * Aplica el principio de Inversión de Dependencias (DIP)
 */
class IDatabase {
  /**
   * Ejecuta una consulta SELECT que devuelve múltiples filas
   * @param {string} query - La consulta SQL
   * @param {Array} params - Parámetros de la consulta
   * @returns {Array} Array de filas resultantes
   */
  all(query, params = []) {
    throw new Error('Method not implemented');
  }

  /**
   * Ejecuta una consulta SELECT que devuelve una sola fila
   * @param {string} query - La consulta SQL
   * @param {Array} params - Parámetros de la consulta
   * @returns {Object|null} La fila resultante o null
   */
  get(query, params = []) {
    throw new Error('Method not implemented');
  }

  /**
   * Ejecuta una consulta INSERT, UPDATE o DELETE
   * @param {string} query - La consulta SQL
   * @param {Array} params - Parámetros de la consulta
   * @returns {Object} Resultado de la ejecución
   */
  run(query, params = []) {
    throw new Error('Method not implemented');
  }

  /**
   * Prepara una consulta para ejecución repetida
   * @param {string} query - La consulta SQL
   * @returns {Object} Statement preparado
   */
  prepare(query) {
    throw new Error('Method not implemented');
  }

  /**
   * Cierra la conexión a la base de datos
   */
  close() {
    throw new Error('Method not implemented');
  }
}

module.exports = IDatabase;