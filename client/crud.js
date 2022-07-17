export async function readSessionUser() {
  const response = await fetch(`/account`, {
    method: 'GET',
  });

  return await response.json();
}

export async function readAlbums() {
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

export async function createAlbums(styles) {
  const response = await fetch(`/createAlbums`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ styles: styles })
  });

  return await response.json();
}

export async function readStyles(styleCount) {
  const response = await fetch(`/styles?styleCount=${styleCount}`, {
    method: 'GET',
  });

  if (response.ok) {
    return (await response.json()).styles;
  } else {
    return [];
  }
}

export async function deleteStyle(style) {
  const response = await fetch(`/deleteStyle?style=${style}`, {
    method: 'DELETE',
  });
}

export async function updateStyles(newStyle) {
  const response = await fetch(`/updateStyles?newStyle=${newStyle}`, {
    method: 'POST',
  });
}