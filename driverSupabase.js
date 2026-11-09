// v=2611.09a
//==================================================================================================
// Gestion des requêtes pour Supabase
//==================================================================================================

// URL de votre application web Google Apps Script
var API_URL = "?";
var API_KEY = "?";
var USER    = "?";
var ID      = "?";

//--------------------------------------------------------------------------------------------------
// Effacement tout ce qui concerne l'utilisateur actuel
//--------------------------------------------------------------------------------------------------
async function SupabaseClearAllInformations()
{
  const t0 = performance.now();
  const lCmd = "user=eq." + USER;
  const lStatus = await SupabaseDelete(lCmd);
  const delta = Math.round(0.100 * (performance.now() - t0)) / 100;
  console.log("Suppression " + lStatus + " (" + delta + "s)");
}


//--------------------------------------------------------------------------------------------------
// Vérification de la connexion à la base de données
// Lecture d'une ligne

//--------------------------------------------------------------------------------------------------
async function SupabaseTestConnexion()
{
  var lRet;
  var lCmd;
  var retStatus;
  do
  {
    // Connexion
    lCmd = "limit=1";
    lRet = await SupabaseRead(lCmd);
    if (lRet.status != "OK")
    {
      retStatus = lRet.status;
      break;
    }

    // Ecriture 301 (ne sert qu'au test écriture/lecture)
    const lDate = DateSupabase();
    const nouveauPoint =
    {
        date: lDate,
        user: USER,
        type: 301,
        msg: "test Write/Read"
    };
    lRet = await SupabaseWrite(nouveauPoint);
    if (lRet != "OK")
    {
      retStatus = "Erreur pendant le test d'écriture";
      break;
    }

    // Relecture 301 (ne sert qu'au test écriture/lecture)
    lCmd = "user=eq." + USER
         + "&type=eq.301"
         + "&order=date.desc"
         + "&limit=100";
    lRet = await SupabaseRead(lCmd);
    if ( (lRet.status != "OK") || (lRet.length == 0) )
    {
      retStatus = "Erreur pendant le test de lecture";
      break;
    }

    // Suppression si 301 existant
    if (lRet.length > 0)
    {
      const lCmd = "user=eq." + USER
                 + "&type=eq.301";
      let lStatus = await SupabaseDelete(lCmd);
      if (lStatus != "OK")
      {
        retStatus = "Erreur pendant le test de suppression";
        break;
      }
    }

    // Relecture 301 (on ne doit plus en avoir)
    lCmd = "user=eq." + USER
         + "&type=eq.301"
         + "&order=date.desc"
         + "&limit=100";
    lRet = await SupabaseRead(lCmd);
    if ( (lRet.status != "OK") || (lRet.length != 0) )
    {
      retStatus = "Erreur pendant le test de relecture";
      break;
    }

    // Tout est bon
    retStatus = "OK";
  } while(0);
  return (retStatus);
}

//--------------------------------------------------------------------------------------------------
// Ecrit le Prénom
// Depuis la variable dans gPrenom
//--------------------------------------------------------------------------------------------------
async function SupabaseWritePrenom(nouveau)
{
  // Effacement des anciens prénoms
  const lCmd = "user=eq." + USER
             + "&type=eq.1000";
  let lStatus = await SupabaseDelete(lCmd);

  // Ecriture du nouveau prénom
  const lDate = DateSupabase();
  const nouveauPoint =
  {
      date: lDate,
      user: USER,
      type: 1000,
      msg: nouveau
  };
  const lRet = await SupabaseWrite(nouveauPoint);
  return(lRet);
}

//--------------------------------------------------------------------------------------------------
// Lit le prénom
//--------------------------------------------------------------------------------------------------
async function SupabaseReadPrenom()
{
  var lRet;
  var lCmd;
  var retStatus;

  // Lecture 1000
  lCmd = "user=eq." + USER
       + "&type=eq.1000"
       + "&order=date.desc"
       + "&limit=1";
  lRet = await SupabaseRead(lCmd);
  return (lRet);
}

//--------------------------------------------------------------------------------------------------
// Ecrit le nom de l'itinéraire
// Depuis la variable dans gNomItineraire
//--------------------------------------------------------------------------------------------------
async function SupabaseWriteNomItineraire(nouveau)
{
  const lDate = DateSupabase();
  const nouveauPoint =
  {
      date: lDate,
      user: USER,
      type: 302,
      msg: nouveau
  };
  lRet = await SupabaseWrite(nouveauPoint);
  return (lRet);
}

//--------------------------------------------------------------------------------------------------
// Lit le nom de l'itinéraire
// Est mis dans gNomItineraire
//--------------------------------------------------------------------------------------------------
async function SupabaseReadNomItineraire()
{
  var lRet;
  var lCmd;
  var retStatus;

  // Lecture 302
  lCmd = "user=eq." + USER
       + "&type=eq.302"
       + "&order=date.desc"
       + "&limit=1";
  lRet = await SupabaseRead(lCmd);
  return (lRet);
}

//--------------------------------------------------------------------------------------------------
// Efface l'itinéraire en cours dans la base de données
//--------------------------------------------------------------------------------------------------
async function SupabaseEffaceItineraire()
{
  // Efface l'itinéraire 0
  const lCmd = "user=eq." + USER
             + "&type=eq.0";
  let lStatus = await SupabaseDelete(lCmd);
  return(lStatus);
}


//==================================================================================================
// Chiffrement et déchiffrement
//==================================================================================================


//--------------------------------------------------------------------------------------------------
// Calcule un CRC16 (CCITT) sur un Uint8Array
//--------------------------------------------------------------------------------------------------
function calculateCRC16(buffer)
{
  let crc = 0xFFFF;
  for (let i = 0; i < buffer.length; i++)
  {
    crc ^= (buffer[i] << 8);
    for (let j = 0; j < 8; j++)
    {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : (crc << 1);
    }
  }
  return(crc & 0xFFFF);
}


//--------------------------------------------------------------------------------------------------
// Conversion binaire <-> base62
//--------------------------------------------------------------------------------------------------
// Alphabet Base62
const B62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Encode un Uint8Array en chaîne Base62
function toBase62(bytes) {
    let n = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    if (n === 0n) return B62_CHARS[0];
    let res = '';
    while (n > 0n) {
        res = B62_CHARS[Number(n % 62n)] + res;
        n /= 62n;
    }
    return res;
}

// Décode une chaîne Base62 en Uint8Array
function fromBase62(str) {
    let n = 0n;
    for (const char of str) {
        const idx = B62_CHARS.indexOf(char);
        if (idx === -1) throw new Error("Caractère Base62 invalide");
        n = n * 62n + BigInt(idx);
    }
    let hex = n.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return bytes;
}

//--------------------------------------------------------------------------------------------------
// Encode et compresse la configuration
//--------------------------------------------------------------------------------------------------
async function encodeSupabaseConfig(url, key, usr, admin)
{
    try {
        const payload = JSON.stringify({ u: url, k: key, i: usr, a: admin ? 1 : 0 });

        const stream = new Blob([payload]).stream().pipeThrough(new CompressionStream('deflate-raw'));
        const compressedBuffer = await new Response(stream).arrayBuffer();
        let bytes = new Uint8Array(compressedBuffer);

        // --- EFFET AVALANCHE (Double passe non-linéaire) ---

        // Passe 1 : Avant
        let salt = 0x42;
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] ^= salt;
            salt = (salt + bytes[i]) & 0xFF; // Mélange non-linéaire
        }

        // Passe 2 : Arrière (pour qu'un changement à la fin impacte le début)
        let salt2 = 0x99;
        for (let i = bytes.length - 1; i >= 0; i--) {
            bytes[i] ^= salt2;
            salt2 = (salt2 + bytes[i]) & 0xFF;
        }

        // Ajout du CRC16
        const crc = calculateCRC16(bytes);
        const finalBytes = new Uint8Array(bytes.length + 2);
        finalBytes.set(bytes);
        finalBytes[bytes.length] = (crc >> 8) & 0xFF;
        finalBytes[bytes.length + 1] = crc & 0xFF;

        return toBase62(finalBytes);
    } catch (error) {
        console.error("Erreur encode : " + error);
        return "";
    }
}

//--------------------------------------------------------------------------------------------------
// Décode et décompresse la configuration
//--------------------------------------------------------------------------------------------------
async function decodeSupabaseConfig(encodedStr) {
    const emptyRes = { url: "", key: "", usr: "", admin: false };
    try {
        if (!encodedStr) return emptyRes;

        const allBytes = fromBase62(encodedStr);
        if (allBytes.length <= 2) return emptyRes;

        const dataBytes = allBytes.slice(0, allBytes.length - 2);
        const receivedCrc = (allBytes[allBytes.length - 2] << 8) | allBytes[allBytes.length - 1];

        if (calculateCRC16(dataBytes) !== receivedCrc) return emptyRes;

        // --- INVERSION DE L'EFFET AVALANCHE ---

        // Inverser Passe 2 (Arrière)
        let salt2 = 0x99;
        for (let i = dataBytes.length - 1; i >= 0; i--) {
            let current = dataBytes[i];
            dataBytes[i] ^= salt2;
            salt2 = (salt2 + current) & 0xFF;
        }

        // Inverser Passe 1 (Avant)
        let salt = 0x42;
        for (let i = 0; i < dataBytes.length; i++) {
            let current = dataBytes[i];
            dataBytes[i] ^= salt;
            salt = (salt + current) & 0xFF;
        }

        const stream = new Blob([dataBytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        const decompressedBuffer = await new Response(stream).arrayBuffer();
        const obj = JSON.parse(new TextDecoder().decode(decompressedBuffer));

        return { url: obj.u, key: obj.k, usr: obj.i, admin: obj.a === 1 };
    } catch (error) {
        return emptyRes;
    }
}


//====================== COMMANDES DE BASE =========================================================


//--------------------------------------------------------------------------------------------------
// Envoie un nouveau point dans la base de données
//--------------------------------------------------------------------------------------------------
async function SupabaseWrite(data)
{
  try
  {
    const response = await fetch(API_URL,
    {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal' // Ne renvoie pas la ligne insérée
      },
      body: JSON.stringify(data)
    });

    if (!response.ok)
    {
      const error = await response.json();
      return("Erreur SupabaseSendPoint : " + error.message);
    }
   return("OK");
  }
  catch (error)
  {
    return("Erreur SupabaseSendPoint : " + error);
  }
}

//--------------------------------------------------------------------------------------------------
// Lit un nombre de points dans la base de données
// En partant de la fin
//--------------------------------------------------------------------------------------------------
async function SupabaseRead(pCmd)
{
  try
  {
    const url = API_URL + "?" + pCmd;
    const response = await fetch(url,
    {
      method: 'GET',
      headers:
      {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok)
    {
      const error = await response.json();
      return {status:"Erreur SupabaseRead : " + error.message, length:0, data:null};
    }

    const lData = await response.json();
    if (lData && lData.length == 0)
      return {status:"OK", length:0, data:null};

    if (lData && lData.length > 0)
    {
      return {status:"OK", length:lData.length , data:lData};
    }
  }
  catch (error)
  {
      return {status:"Erreur SupabaseRead", length:0, data:null};
  }
}

//--------------------------------------------------------------------------------------------------
// Supprime des éléments dans la base de données selon une condition
//--------------------------------------------------------------------------------------------------
async function SupabaseDelete(pCmd)
{
  try
  {
    const url = API_URL + "?" + pCmd;
    const response = await fetch(url,
    {
      method: 'DELETE', // Méthode HTTP pour supprimer
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok)
    {
      const error = await response.json();
      return("Erreur SupabaseDelete : " + error.message);
    }
    return("OK");
  }
  catch (error)
  {
    return("Erreur SupabaseDelete : " + error);
  }
}

//--------------------------------------------------------------------------------------------------
// Compte le nombre de points correspondant à un critère
//--------------------------------------------------------------------------------------------------
async function SupabaseCount(pCmd)
{
  try
  {
    const url = API_URL + "?" + pCmd;
    const response = await fetch(url,
    {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Prefer': 'count=exact' // Demande à Supabase de calculer le total
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return { status: "Erreur SupabaseCount : " + error.message, count: -1 };
    }

    // Le résultat se trouve dans le header 'content-range'
    // Format reçu : "0-0/125" (où 125 est le total)
    const contentRange = response.headers.get('content-range');
    let total = 0;

    if (contentRange)
    {
      const parts = contentRange.split('/');
      if (parts.length > 1)
      {
        total = parseInt(parts[1], 10);
      }
    }
    return { status: "OK", count: total };
  }
  catch (error)
  {
    return { status: "Erreur SupabaseCount : " + error, count: -1 };
  }
}
