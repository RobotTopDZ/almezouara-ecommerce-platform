const axios = require('axios');

class YalidineService {
  constructor() {
    this.baseURL = 'https://api.yalidine.app/v1';
    this.apiId = process.env.YALIDINE_API_ID;
    this.apiToken = process.env.YALIDINE_API_TOKEN;
  }

  // Test API connection
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/wilayas/`, {
        headers: {
          'X-API-ID': this.apiId,
          'X-API-TOKEN': this.apiToken
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  // Get wilayas list
  async getWilayas() {
    try {
      const response = await axios.get(`${this.baseURL}/wilayas/`, {
        headers: {
          'X-API-ID': this.apiId,
          'X-API-TOKEN': this.apiToken
        }
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  // Get communes by wilaya
  async getCommunes(wilayaId) {
    try {
      const response = await axios.get(`${this.baseURL}/communes/?wilaya_id=${wilayaId}`, {
        headers: {
          'X-API-ID': this.apiId,
          'X-API-TOKEN': this.apiToken
        }
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  // Get stopdesk centers by commune
  async getStopdeskCenters(communeId) {
    try {
      const response = await axios.get(`${this.baseURL}/centers/?commune_id=${communeId}`, {
        headers: {
          'X-API-ID': this.apiId,
          'X-API-TOKEN': this.apiToken
        }
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  // Get shipping fees
  async getShippingFees(fromWilayaId, toWilayaId) {
    try {
      const response = await axios.get(`${this.baseURL}/fees/?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`, {
        headers: {
          'X-API-ID': this.apiId,
          'X-API-TOKEN': this.apiToken
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  // Create parcel in Yalidine
  async createParcel(orderData) {
    try {
      const parcelData = {
        order_id: orderData.id,
        from_wilaya_name: "Alger", // Your business location
        firstname: orderData.fullName.split(' ')[0],
        familyname: orderData.fullName.split(' ').slice(1).join(' ') || orderData.fullName.split(' ')[0],
        contact_phone: orderData.phoneNumber,
        address: orderData.address,
        to_commune_name: orderData.city,
        to_wilaya_name: orderData.wilaya,
        product_list: orderData.items.map(item => `${item.name} (${item.quantity}x)`).join(', '),
        price: orderData.productPrice,
        do_insurance: true,
        declared_value: orderData.productPrice,
        length: 30, // Standard clothing package dimensions
        width: 20,
        height: 10,
        weight: 1, // Light clothing items
        freeshipping: orderData.shippingCost === 0,
        is_stopdesk: orderData.deliveryMethod === 'stopdesk',
        stopdesk_id: orderData.stopdeskId || null,
        has_exchange: false,
        product_to_collect: null
      };

      const response = await axios.post(`${this.baseURL}/parcels/`, [parcelData], {
        headers: {
          'X-API-ID': this.apiId,
          'X-API-TOKEN': this.apiToken,
          'Content-Type': 'application/json'
        }
      });

      return { 
        success: true, 
        data: response.data[orderData.id] 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  // Get parcel status
  async getParcelStatus(tracking) {
    try {
      const response = await axios.get(`${this.baseURL}/parcels/${tracking}`, {
        headers: {
          'X-API-ID': this.apiId,
          'X-API-TOKEN': this.apiToken
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  // Get parcel history
  async getParcelHistory(tracking) {
    try {
      const response = await axios.get(`${this.baseURL}/histories/${tracking}`, {
        headers: {
          'X-API-ID': this.apiId,
          'X-API-TOKEN': this.apiToken
        }
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  // Map our wilaya names to Yalidine wilaya IDs
  getWilayaMapping() {
    return {
      'Adrar': 1,
      'Chlef': 2,
      'Laghouat': 3,
      'Oum El Bouaghi': 4,
      'Batna': 5,
      'Béjaïa': 6,
      'Biskra': 7,
      'Béchar': 8,
      'Blida': 9,
      'Bouira': 10,
      'Tamanrasset': 11,
      'Tébessa': 12,
      'Tlemcen': 13,
      'Tiaret': 14,
      'Tizi Ouzou': 15,
      'Alger': 16,
      'Djelfa': 17,
      'Jijel': 18,
      'Sétif': 19,
      'Saïda': 20,
      'Skikda': 21,
      'Sidi Bel Abbès': 22,
      'Annaba': 23,
      'Guelma': 24,
      'Constantine': 25,
      'Médéa': 26,
      'Mostaganem': 27,
      'M\'Sila': 28,
      'Mascara': 29,
      'Ouargla': 30,
      'Oran': 31,
      'El Bayadh': 32,
      'Illizi': 33,
      'Bordj Bou Arreridj': 34,
      'Boumerdès': 35,
      'El Tarf': 36,
      'Tindouf': 37,
      'Tissemsilt': 38,
      'El Oued': 39,
      'Khenchela': 40,
      'Souk Ahras': 41,
      'Tipaza': 42,
      'Mila': 43,
      'Aïn Defla': 44,
      'Naâma': 45,
      'Aïn Témouchent': 46,
      'Ghardaïa': 47,
      'Relizane': 48
    };
  }

  // Get wilaya ID by name
  getWilayaId(wilayaName) {
    const mapping = this.getWilayaMapping();
    return mapping[wilayaName] || null;
  }
}

module.exports = YalidineService;

