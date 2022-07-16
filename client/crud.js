export async function readSessionUser() {
  const response = await fetch(`/account`, {
    method: 'GET',
  });

  return await response.json();
}

export async function getAlbums() {

}

export async function generateAlbums() {

}

export async function getStyles(styleCount) {
  const response = await fetch(`/styles?styleCount=${styleCount}`, {
    method: 'GET',
  });

  if (response.ok) {
    return (await response.json()).styles;
  } else {
    return [];
  }
}

export async function updateStyles(styleCount) {

}

export async function deleteStyle(styleCount) {

}


