import { Injectable } from '@nestjs/common';
import { Professional } from './professionals.types';
import { DbService } from 'src/db/db.service';
import { Facts } from 'src/chat/chat.types';

@Injectable()
export class ProfessionalsService {
  constructor(private readonly dbService: DbService) {}

  async getProfessional({ facts }: { facts: Facts }): Promise<Professional> {
    let query = this.dbService.client.from('professionals').select();

    const { professionalType, location } = facts.informationRetrieved;
    if (professionalType) {
      query = query.contains('specialties', [professionalType]);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    query = query.limit(1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data.length) {
      return undefined;
    }

    const prof = data[0];
    facts.informationRetrieved.professionalId = prof.id;

    return {
      id: prof.id,
      name: prof.name,
      surname: prof.surname,
      sessionPrice: prof.session_price,
      sessionDuration: prof.session_duration,
      location: prof.location,
      online: prof.online,
      description: prof.description,
      rating: prof.rating,
      reviews: prof.reviews,
      specialties: prof.specialties,
      languages: prof.languages,
    };
  }

  async bookProfessional({ facts }: { facts: Facts }) {
    const { professionalId, message } = facts.informationRetrieved;

    if (!professionalId) {
      throw new Error('Professional ID is required for booking');
    }

    const bookingResult = {
      bookingId: `booking_${Date.now()}`,
      professionalId,
      message: message || 'No additional message',
      status: 'confirmed',
      timestamp: new Date().toISOString(),
    };

    console.log('📧 BOOKING EMAIL SENT: ', bookingResult);

    return bookingResult;
  }
}
