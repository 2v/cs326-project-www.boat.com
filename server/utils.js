// Fisher-Yates shuffle (https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
// -- To shuffle an array a of n elements (indices 0..n-1):
// for i from n−1 downto 1 do
//   j ← random integer such that 0 ≤ j ≤ i
// exchange a[j] and a[i]

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i+1))
    let temp = array[j];
    array[j] = array[i];
    array[i] = temp;
  }
  return array;
}

export { shuffle }