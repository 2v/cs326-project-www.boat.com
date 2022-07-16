export async function readSessionUser() {
  const response = await fetch(`/account`, {
    method: 'GET',
  });

  return await response.json();
}

export async function getAlbums() {
  const response = await fetch(`/albums`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return (await response.json()).albums;
  } else {
    return [];
  }
}

export async function generateAlbums(styles) {
  const response = await fetch(`/generateAlbums`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ styles: styles })
  });

  return await response.json();
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


