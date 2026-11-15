//==================================================================================================
// GVersion.js : Gobal Version
// Change la Date dans les fichiers du répertoire courant
// S'exécute via node.js : node gversion.js
// Note : il faut créer le fichier date.ref avec la date du jour exemple 2611.15H
//==================================================================================================

import fs from 'node:fs/promises';
import path from 'node:path';
main();

const GREEN  = "\x1b[32m";
const CYAN   = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";
const RESET  = "\x1b[0m";

//--------------------------------------------------------------------------------------------------
// Change la Date dans les fichiers du répertoire courant
//--------------------------------------------------------------------------------------------------
async function replaceInDir(dir, searchStr, replaceStr, extensions = ['.js', '.css', '.html', '.json', '.ref']) {
  try
  {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries)
    {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory())
      {
        // Ignore les dossiers lourds ou inutiles
        if (!['node_modules', '.git', 'dist', '.idea'].includes(entry.name))
        {
          await replaceInDir(fullPath, searchStr, replaceStr, extensions);
        }
      } else if (entry.isFile())
      {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext))
        {
          let content = await fs.readFile(fullPath, 'utf8');
          if (content.includes(searchStr))
          {
            const newContent = content.replaceAll(searchStr, replaceStr);
            await fs.writeFile(fullPath, newContent, 'utf8');
            console.log(YELLOW + fullPath + RESET + " mis à jour");
          }
        }
      }
    }
  }
  catch (err)
  {
    console.error("Erreur : " + err.message);
  }
}

//--------------------------------------------------------------------------------------------------
// Lit la version stockée dans le fichier Gdate.ref
//--------------------------------------------------------------------------------------------------
async function readDateRef()
{
  const filePath = "Gdate.ref";
  try
  {
    const data = await fs.readFile(filePath, 'utf8');
    return (data.trim());
  }
  catch (err)
  {
    console.error(`Erreur lors de la lecture de ${filePath} : ${err.message}`);
    return ("");
  }
}

//--------------------------------------------------------------------------------------------------
// Formate une date en YYMM.DD
//--------------------------------------------------------------------------------------------------
function formatDateRef()
{
  const lDate = new Date();
  const year = String(lDate.getFullYear()).slice(-2);
  const month = String(lDate.getMonth() + 1).padStart(2, '0');
  const day = String(lDate.getDate()).padStart(2, '0');
  return (year + month + "." + day);
}

//--------------------------------------------------------------------------------------------------
// MAIN
//--------------------------------------------------------------------------------------------------
async function main()
{
  console.log("----- GVersion -----");
  const lDateRef = await readDateRef();
  const lDateNew = formatDateRef();
  console.log("Version actuelle   " + lDateRef);

  // Construction de la nouvelle date
  if (lDateRef == "")
  {
    console.log(RED + "Erreur : il manque la date dans le fichier date.ref" + RESET);
    return;
  }

  // Erreur sur DateRef
  if (lDateRef.length != 8)
  {
    console.log(RED + "Erreur : la date dans le fichier date.ref est incorrecte" + RESET);
    return;
  }

  // Si c'est le même jour, on change la lettre
  const lDayRef = lDateRef.substring(0, 7);
  let   lIndiceRef = lDateRef.substring(7, 8);
  const lDayNew = lDateNew;
  if (lDayRef == lDayNew)
  {
    // Si dépassement, on passe en majuscule
    if (lIndiceRef == "z")
      lIndiceRef = "@";

    const lIndiceNew = String.fromCharCode(lIndiceRef.charCodeAt(0) + 1);
    const lNewDateRef = lDayNew + lIndiceNew;
    console.log("Nouvelle date      " + lNewDateRef);
    await replaceInDir("./", lDateRef, lNewDateRef).then(() =>
    {
        return;
    });
  }

  // Si le jour est différent, on met à jour
  else
  {
    const lNewDateRef = lDayNew + "a";
    console.log("Nouvelle date      " + lNewDateRef);
    await replaceInDir("./", lDateRef, lNewDateRef).then(() =>
    {
        return;
    });
  }
}
