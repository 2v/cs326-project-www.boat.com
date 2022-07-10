async function readSessionUser() {
  const response = await fetch(`/account`, {
    method: 'GET',
  });

  return await response.json();
}

export { readSessionUser }