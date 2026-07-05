(function () {
  var root = document.querySelector('.capability-map');
  if (!root) return;

  var svg = root.querySelector('.capability-map__tree');
  var nodes = root.querySelectorAll('.cm-node');

  nodes.forEach(function (node) {
    var key = node.getAttribute('data-node');
    var connector = svg ? svg.querySelector('.cm-connector[data-node="' + key + '"]') : null;

    function activate() {
      node.classList.add('is-active');
      if (connector) connector.style.opacity = '0.9';
    }

    function deactivate() {
      node.classList.remove('is-active');
      if (connector) connector.style.opacity = '';
    }

    node.addEventListener('mouseenter', activate);
    node.addEventListener('mouseleave', deactivate);
    node.addEventListener('focus', activate);
    node.addEventListener('blur', deactivate);
  });
})();
