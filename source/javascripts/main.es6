import Embryo from '../javascripts/embryo.es6';

$(function () {
  var data = [];
  $('.contribution').each(function() {
    data.push({
      text: $(this).find('p').text(),
      image: $(this).find('img').get(0)
    });
  });
  console.log(new Embryo(data, document.body, 1000, 500));
});