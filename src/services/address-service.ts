import { Address } from "../models/address";
import prisma from "../prisma";

export class AddressService {
  public async findAll(): Promise<Address[]> {
    const addressList: Address[] = await prisma.address.findMany({});
    return addressList;
  }
}