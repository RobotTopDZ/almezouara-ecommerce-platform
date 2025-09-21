// Shared shipping prices for consistency across the application

// Domicile delivery prices by wilaya
export const domicilePrices = {
  'Adrar': 600,
  'Chlef': 300,
  'Laghouat': 400,
  'Oum El Bouaghi': 300,
  'Batna': 300,
  'Béjaïa': 300,
  'Biskra': 400,
  'Béchar': 400,
  'Blida': 300,
  'Bouira': 300,
  'Tamanrasset': 800,
  'Tébessa': 400,
  'Tlemcen': 200,
  'Tiaret': 300,
  'Tizi Ouzou': 300,
  'Alger': 250,
  'Djelfa': 400,
  'Jijel': 300,
  'Sétif': 300,
  'Saïda': 300,
  'Skikda': 300,
  'Sidi Bel Abbès': 250,
  'Annaba': 300,
  'Guelma': 300,
  'Constantine': 300,
  'Médéa': 300,
  'Mostaganem': 300,
  'M\'Sila': 300,
  'Mascara': 300,
  'Ouargla': 400,
  'Oran': 300,
  'El Bayadh': 600,
  'Illizi': 800,
  'Bordj Bou Arreridj': 300,
  'Boumerdès': 300,
  'El Tarf': 300,
  'Tindouf': 800,
  'Tissemsilt': 300,
  'El Oued': 400,
  'Khenchela': 300,
  'Souk Ahras': 300,
  'Tipaza': 300,
  'Mila': 300,
  'Aïn Defla': 300,
  'Naâma': 400,
  'Aïn Témouchent': 250,
  'Ghardaïa': 400,
  'Relizane': 300
};

// Stopdesk delivery prices by wilaya
export const stopdeskPrices = {
  'Adrar': 850,
  'Chlef': 400,
  'Laghouat': 600,
  'Oum El Bouaghi': 400,
  'Batna': 400,
  'Béjaïa': 400,
  'Biskra': 600,
  'Béchar': 600,
  'Blida': 400,
  'Bouira': 400,
  'Tamanrasset': 1000,
  'Tébessa': 600,
  'Tlemcen': 300,
  'Tiaret': 400,
  'Tizi Ouzou': 400,
  'Alger': 350,
  'Djelfa': 600,
  'Jijel': 400,
  'Sétif': 400,
  'Saïda': 400,
  'Skikda': 400,
  'Sidi Bel Abbès': 350,
  'Annaba': 400,
  'Guelma': 400,
  'Constantine': 400,
  'Médéa': 400,
  'Mostaganem': 400,
  'M\'Sila': 400,
  'Mascara': 400,
  'Ouargla': 600,
  'Oran': 400,
  'El Bayadh': 850,
  'Illizi': 1000,
  'Bordj Bou Arreridj': 400,
  'Boumerdès': 400,
  'El Tarf': 400,
  'Tindouf': 1000,
  'Tissemsilt': 400,
  'El Oued': 600,
  'Khenchela': 400,
  'Souk Ahras': 400,
  'Tipaza': 400,
  'Mila': 400,
  'Aïn Defla': 400,
  'Naâma': 600,
  'Aïn Témouchent': 350,
  'Ghardaïa': 500,
  'Relizane': 400
};

// Helper function to get shipping cost
export const getShippingCost = (wilaya, deliveryMethod) => {
  if (!wilaya || !deliveryMethod) return 0;
  
  if (deliveryMethod === 'domicile') {
    return domicilePrices[wilaya] || 0;
  } else if (deliveryMethod === 'stopdesk') {
    return stopdeskPrices[wilaya] || 0;
  }
  
  return 0;
};

// Generate complete domicile fees data for admin dashboard (by commune)
export const generateCompleteDomicileFees = () => {
  const communes = {
    'Adrar': ['Adrar', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Ahmed Timmi', 'Zaouiet Kounta', 'Aoulef', 'Akabli', 'Metarfa', 'Tinerkouk', 'Deldoul', 'Charouine', 'Reggane', 'In Zghmir', 'Talmine', 'Tamest', 'Fenoughil', 'Tit', 'Ksar Kaddour', 'Tsabit', 'Tamantit', 'Tamekten', 'Timimoun', 'Ouled Said', 'Bouda', 'Adrouine', 'Talmine', 'Ksar Kaddour'],
    'Chlef': ['Chlef', 'Ténès', 'Boukadir', 'El Karimia', 'Sobha', 'Harchoun', 'Ouled Fares', 'Sidi Akkacha', 'Bouzeghaia', 'Talassa', 'Herenfa', 'Labiod Medjadja', 'El Marsa', 'Tadjena', 'Taougrite', 'Beni Haoua', 'Sendjas', 'Zeboudja', 'Oued Goussine', 'Dahra', 'Ouled Ben Abdelkader', 'Beni Rached', 'Abou El Hassan', 'El Hadjadj', 'Sidi Abderrahmane', 'Moussadek', 'El Matmar', 'Oued Sly', 'Boukadir', 'Ain Merane', 'Oued Fodda', 'Ouled Fares', 'Chlef', 'Chettia'],
    // Add more communes as needed...
  };
  
  const fees = [];
  let id = 1;
  
  Object.keys(domicilePrices).forEach(wilaya => {
    const wilayaCommunes = communes[wilaya] || [wilaya]; // Default to wilaya name if no communes defined
    wilayaCommunes.forEach(commune => {
      fees.push({
        id: id++,
        commune: commune,
        wilaya: wilaya,
        prix: domicilePrices[wilaya]
      });
    });
  });
  
  return fees;
};







