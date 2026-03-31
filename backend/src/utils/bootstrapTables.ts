import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ensureParityTables(): Promise<void> {
  // Creates legacy parity tables only if they do not exist.
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS fornecedor (
      id_fornecedor INT NOT NULL AUTO_INCREMENT,
      razao VARCHAR(255) NOT NULL,
      cnpj VARCHAR(20) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
      data DATETIME NULL,
      id_usuario INT NULL,
      PRIMARY KEY (id_fornecedor),
      KEY idx_fornecedor_usuario (id_usuario)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS lancamento (
      id_lancamento INT NOT NULL AUTO_INCREMENT,
      id_fornecedor INT NOT NULL,
      total FLOAT NOT NULL DEFAULT 0,
      data DATETIME NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
      PRIMARY KEY (id_lancamento),
      KEY idx_lancamento_fornecedor (id_fornecedor),
      CONSTRAINT fk_lancamento_fornecedor
        FOREIGN KEY (id_fornecedor)
        REFERENCES fornecedor(id_fornecedor)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS lancamento_item (
      id_item_lancamento INT NOT NULL AUTO_INCREMENT,
      id_lancamento INT NOT NULL,
      id_produto INT NOT NULL,
      qtd FLOAT NOT NULL,
      vlr_item FLOAT NOT NULL,
      vlr_total FLOAT NOT NULL,
      PRIMARY KEY (id_item_lancamento),
      KEY idx_lancamento_item_lancamento (id_lancamento),
      KEY idx_lancamento_item_produto (id_produto),
      CONSTRAINT fk_lancamento_item_lancamento
        FOREIGN KEY (id_lancamento)
        REFERENCES lancamento(id_lancamento)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      CONSTRAINT fk_lancamento_item_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto(id_produto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS app_config (
      id_config INT NOT NULL AUTO_INCREMENT,
      config_key VARCHAR(80) NOT NULL,
      config_value TEXT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id_config),
      UNIQUE KEY uq_app_config_key (config_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS financeiro (
      id_financeiro INT NOT NULL AUTO_INCREMENT,
      id_cliente INT NOT NULL,
      limite_credito FLOAT NOT NULL DEFAULT 0,
      saldo_utilizado FLOAT NOT NULL DEFAULT 0,
      ultimo_limite FLOAT NOT NULL DEFAULT 0,
      data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      usuario_alteracao VARCHAR(255) NOT NULL,
      PRIMARY KEY (id_financeiro),
      UNIQUE KEY uq_financeiro_cliente (id_cliente),
      CONSTRAINT fk_financeiro_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const clienteCreditoColumns = await prisma.$queryRawUnsafe<Array<{ total: bigint | number }>>(`
    SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cliente'
      AND COLUMN_NAME = 'limite_credito'
  `);

  if (Number(clienteCreditoColumns[0]?.total || 0) > 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE cliente
      DROP COLUMN limite_credito
    `);
  }

  // Initialize financeiro records for clients without one
  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO financeiro (id_cliente, limite_credito, saldo_utilizado, ultimo_limite, data_criacao, usuario_alteracao)
    SELECT DISTINCT id_cliente, 0, 0, 0, NOW(), 'BOOTSTRAP'
    FROM cliente
    WHERE id_cliente NOT IN (SELECT DISTINCT id_cliente FROM financeiro)
  `);
}
