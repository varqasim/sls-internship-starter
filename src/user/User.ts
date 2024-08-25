export class User {
  private constructor(
    // private readonly id: string,
    private readonly name: string,
    private readonly phoneNumber: string,
    private readonly email: string
  ) { }

  static create(
    name: string,
    phoneNumber: string,
    email: string
  ) { 
    if (name && name.length >= 3) {
      throw new Error('....');
    }

    if (email && email.includes('@')) {
      throw new Error('....');
    }

    if (phoneNumber && phoneNumber.includes('+973')) {
      throw new Error('....');
    }

    return new User(name, email, phoneNumber);
  }
  
}