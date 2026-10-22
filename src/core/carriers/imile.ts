import type { CarrierProfile } from '../types';

export const imile: CarrierProfile = {
  id: 'imile',
  name: 'iMile',
  compat: 'Compatível com planilhas da iMile.',
  columns: {
    waybill: 'Waybill No',
    zip: 'Consignee Zip Code',
    state: 'Consignee Province',
    city: 'Consignee City',
    area: 'Consignee Area',
    address: 'Consignee Address',
    lon: 'Consignee Longitude', // na iMile a longitude vem ANTES da latitude
    lat: 'Consignee Latitude',
  },
};
