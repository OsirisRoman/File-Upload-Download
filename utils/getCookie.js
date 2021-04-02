//This function will extract the value for
//a given cookie from the complete cookie string
let readCookie = (completeCookie, cookieName) => {
  // The objective cookie is formed by a semicolon or space
  // followed by the cookie name and then an equal sign
  // the value will be a word ()
  // the word will be composed by any character without spaces,
  // tabs or enter, neither semicolon and these characters which
  // compose the word and are not spaces, ... bla bla bla
  // can appear zero (empty value) or any number of times *.
  let re = new RegExp('[; ]' + cookieName + '=([^\\s;]*)');
  // The value returned by match() is stored in the sMatch
  // variable. If there is no matching cookie, sMatch will
  // be set to null. If there is a match, sMatch will store
  // an array of matched substrings: the first element
  // sMatch[0] contains the whole RegExp match (e.g. MyCookie=CookieValue).
  // Subsequent elements of the array, sMatch[1] etc., will
  // hold the substrings matched(CookieValue) with each capturing group.
  // Since we have only one capturing group, sMatch[1] is the
  // last element in the array; it is in sMatch[1] that match()
  // puts the cookie value we want to get.
  let sMatch = (' ' + completeCookie).match(re);

  if (sMatch) return unescape(sMatch[1]);
  return '';
};

module.exports = { readCookie };
