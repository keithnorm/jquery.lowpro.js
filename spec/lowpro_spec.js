describe('jquery.lowpro', function() {
  beforeEach(function(){
    html = $("<div id='click_here'><a href='#'>Buy!</a></div>");
    $('#fixtures').append(html);
    called = false;
  });

  afterEach(function() {
    $('#fixtures').empty();
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


  describe('binding to Behavior objects', function() {

    beforeEach(function() {
      calledClick = false;
      SomeBehavior = Behavior.create({
        initialize: function() {
          called = true;
        },

        onclick: function() {
          calledClick = !calledClick;
        }
      });
    });

    it('binds behavior objects', function() {
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

    it('binds behaviors to elements added after initial page load', function() {
      Event.addBehavior({
        '#new_element a': SomeBehavior 
      });

      html = $("<div id='new_element'><a href='#'>Buy!</a></div>");
      $('#fixtures').append(html);

      $('#new_element a').click();
      expect(calledClick).toBeTruthy();
      //proving the behavior actually got bound, not just that
      // the event handler was called
      $('#new_element a').click();
      expect(calledClick).toBeFalsy();
    });

  });
});
  
