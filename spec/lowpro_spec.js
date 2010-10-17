describe('jquery.lowpro', function() {
  beforeEach(function(){
    html = $("<div id='click_here'><a href='#'>Buy!</a></div>");
    $('#fixtures').append(html);
    called = false;
  });

  it('binds to single selectors', function() {
    Event.addBehavior({
      '#click_here': function() {
        called = true;
      }
    });
    expect(called).toBeTruthy();
  });

  it('binds to multiple selectors', function() {
    Event.addBehavior({
      '#whatever, #click_here a': function() {
        called = true;
      }
    });
    expect(called).toBeTruthy();
  });

  it('binds event handlers', function() {
    Event.addBehavior({
      '#click_here a:click': function() {
        called = true;
      }
    });
    expect(called).toBeFalsy();
    $('#click_here a').click();
    expect(called).toBeTruthy();
  });

  it('binds behavior objects', function() {
    var calledClick = false;
    var SomeBehavior = Behavior.create({
      initialize: function() {
        called = true;
      },

      onclick: function() {
        calledClick = true;
      }
    });
    Event.addBehavior({
      '#click_here a': SomeBehavior 
    });
    expect(called).toBeTruthy();
    expect(calledClick).toBeFalsy();
    $('#click_here a').click();
    expect(calledClick).toBeTruthy();
  });

  it('passes the event object through to callback', function() {
    eventType = '';
    Event.addBehavior({
      '#click_here a:click': function(e) {
        eventType = e.type;
      }
    });
    $('#click_here a').click();
    expect(eventType).toEqual('click');
  });
});
  
