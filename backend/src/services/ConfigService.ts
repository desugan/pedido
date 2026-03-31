import { ConfigRepository } from '../repositories/ConfigRepository';

export class ConfigService {
  private repository = new ConfigRepository();

  private isValidCpf(cpf: string): boolean {
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
    let check = (sum * 10) % 11;
    if (check === 10) check = 0;
    if (check !== Number(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
    check = (sum * 10) % 11;
    if (check === 10) check = 0;
    return check === Number(cpf[10]);
  }

  private isValidCnpj(cnpj: string): boolean {
    if (!/^\d{14}$/.test(cnpj) || /^(\d)\1+$/.test(cnpj)) return false;
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i += 1) sum += Number(cnpj[i]) * w1[i];
    let check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (check !== Number(cnpj[12])) return false;
    sum = 0;
    for (let i = 0; i < 13; i += 1) sum += Number(cnpj[i]) * w2[i];
    check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return check === Number(cnpj[13]);
  }

  private isValidPixKey(value: string): boolean {
    const key = String(value || '').trim();
    if (!key) return false;

    const digits = key.replace(/\D/g, '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+55\d{10,11}$/;
    const randomKeyRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return (
      emailRegex.test(key)
      || phoneRegex.test(key)
      || this.isValidCpf(digits)
      || this.isValidCnpj(digits)
      || randomKeyRegex.test(key)
    );
  }

  async getPixKey(): Promise<string | null> {
    return this.repository.getPixKey();
  }

  async setPixKey(pixKey: string): Promise<string> {
    const value = (pixKey || '').trim();
    if (!value) {
      throw new Error('Chave PIX é obrigatória');
    }

    if (!this.isValidPixKey(value)) {
      throw new Error('Formato de chave PIX inválido (telefone deve conter +55)');
    }

    return this.repository.setPixKey(value);
  }

  async getPixNome(): Promise<string | null> {
    return this.repository.getPixNome();
  }

  async setPixNome(nome: string): Promise<string> {
    const value = (nome || '').trim();
    if (!value) {
      throw new Error('Nome PIX é obrigatório');
    }

    return this.repository.setPixNome(value);
  }
}
